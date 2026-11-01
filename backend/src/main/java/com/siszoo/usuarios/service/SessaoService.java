package com.siszoo.usuarios.service;

import java.time.Clock;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.siszoo.usuarios.entity.AcaoAuditoria;
import com.siszoo.usuarios.entity.MotivoEncerramentoSessao;
import com.siszoo.usuarios.entity.SessaoUsuario;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.exception.SessaoExpiradaException;
import com.siszoo.usuarios.repository.SessaoUsuarioRepository;

// Sessao com renovacao deslizante (docs/decisoes/sessao.md). O prazo de
// inatividade conta de ultima_atividade_em, que so avanca em renovacao com
// atividade declarada: sem renovacao, a sessao morre sozinha no servidor.
@Service
public class SessaoService {

    private static final int TAMANHO_USER_AGENT = 255;

    private final SessaoUsuarioRepository sessaoRepository;
    private final AuditoriaEventoService auditoriaEventoService;
    private final Clock clock;
    private final Duration inatividade;
    private final Duration intervaloRotacao;
    private final Duration toleranciaTokenAnterior;

    public SessaoService(
            SessaoUsuarioRepository sessaoRepository,
            AuditoriaEventoService auditoriaEventoService,
            Clock clock,
            @Value("${siszoo.sessao.inatividade-minutos}") long inatividadeMinutos,
            @Value("${siszoo.sessao.rotacao-minutos}") long rotacaoMinutos,
            @Value("${siszoo.sessao.tolerancia-token-anterior-segundos}") long toleranciaSegundos) {
        this.sessaoRepository = sessaoRepository;
        this.auditoriaEventoService = auditoriaEventoService;
        this.clock = clock;
        this.inatividade = Duration.ofMinutes(inatividadeMinutos);
        this.intervaloRotacao = Duration.ofMinutes(rotacaoMinutos);
        this.toleranciaTokenAnterior = Duration.ofSeconds(toleranciaSegundos);
    }

    // tokenRenovacao e nulo quando o token do cookie continua valendo.
    public record SessaoRenovada(SessaoUsuario sessao, String tokenRenovacao) {
    }

    @Transactional
    public SessaoRenovada criar(Usuario usuario, String ip, String userAgent) {
        LocalDateTime agora = agora();
        String token = TokenOpaco.novo();

        SessaoUsuario sessao = new SessaoUsuario();
        sessao.setUsuario(usuario);
        sessao.setTokenHash(TokenOpaco.hash(token));
        sessao.setRotacionadoEm(agora);
        sessao.setCriadaEm(agora);
        sessao.setUltimaAtividadeEm(agora);
        sessao.setIp(ip);
        sessao.setUserAgent(limitar(userAgent));
        return new SessaoRenovada(sessaoRepository.save(sessao), token);
    }

    // noRollbackFor: encerrar por inatividade ou reuso precisa ser gravado
    // mesmo com a recusa ao cliente.
    @Transactional(noRollbackFor = SessaoExpiradaException.class)
    public SessaoRenovada renovar(String token, boolean houveAtividade) {
        if (token == null || token.isBlank()) {
            throw new SessaoExpiradaException();
        }
        String hashApresentado = TokenOpaco.hash(token);
        SessaoUsuario sessao = sessaoRepository.buscarPorHashParaAtualizar(hashApresentado)
                .orElseThrow(SessaoExpiradaException::new);
        LocalDateTime agora = agora();

        if (sessao.getEncerradaEm() != null) {
            throw new SessaoExpiradaException();
        }
        if (sessao.getUltimaAtividadeEm().plus(inatividade).isBefore(agora)) {
            sessao.encerrar(agora, MotivoEncerramentoSessao.INATIVIDADE);
            throw new SessaoExpiradaException();
        }
        if (!sessao.getUsuario().isAtivo()) {
            sessao.encerrar(agora, MotivoEncerramentoSessao.USUARIO_DESATIVADO);
            throw new SessaoExpiradaException();
        }

        boolean tokenAtual = hashApresentado.equals(sessao.getTokenHash());
        if (!tokenAtual && sessao.getRotacionadoEm().plus(toleranciaTokenAnterior).isBefore(agora)) {
            revogarPorReuso(sessao, agora);
            throw new SessaoExpiradaException();
        }

        if (houveAtividade) {
            sessao.setUltimaAtividadeEm(agora);
        }
        if (!tokenAtual || sessao.getRotacionadoEm().plus(intervaloRotacao).isAfter(agora)) {
            return new SessaoRenovada(sessao, null);
        }
        String novoToken = TokenOpaco.novo();
        sessao.setTokenAnteriorHash(sessao.getTokenHash());
        sessao.setTokenHash(TokenOpaco.hash(novoToken));
        sessao.setRotacionadoEm(agora);
        return new SessaoRenovada(sessao, novoToken);
    }

    // Logout: nao recusa cookie vencido nem ausente; o objetivo e so sair.
    @Transactional
    public Optional<Usuario> encerrarPeloToken(String token) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }
        return sessaoRepository.buscarPorHashParaAtualizar(TokenOpaco.hash(token))
                .filter(sessao -> sessao.getEncerradaEm() == null)
                .map(sessao -> {
                    sessao.encerrar(agora(), MotivoEncerramentoSessao.LOGOUT);
                    return sessao.getUsuario();
                });
    }

    // sessaoMantida: a sessao de quem esta agindo, quando ela deve continuar.
    @Transactional
    public void encerrarDoUsuario(UUID usuarioId, MotivoEncerramentoSessao motivo, UUID sessaoMantida) {
        LocalDateTime agora = agora();
        sessaoRepository.listarAtivasDoUsuario(usuarioId).stream()
                .filter(sessao -> !sessao.getId().equals(sessaoMantida))
                .forEach(sessao -> sessao.encerrar(agora, motivo));
    }

    public Optional<Boolean> senhaTemporariaDaSessaoAtiva(UUID sessaoId, UUID usuarioId) {
        return sessaoRepository.senhaTemporariaDaSessaoAtiva(sessaoId, usuarioId, agora().minus(inatividade));
    }

    private void revogarPorReuso(SessaoUsuario sessao, LocalDateTime agora) {
        sessao.encerrar(agora, MotivoEncerramentoSessao.REUSO_TOKEN);
        auditoriaEventoService.registrar(sessao.getUsuario(), AcaoAuditoria.SESSAO_REVOGADA, "sessao_usuario",
                sessao.getId(), null, Map.of("motivo", MotivoEncerramentoSessao.REUSO_TOKEN));
    }

    private LocalDateTime agora() {
        return LocalDateTime.now(clock);
    }

    private static String limitar(String userAgent) {
        if (userAgent == null) {
            return null;
        }
        return userAgent.length() <= TAMANHO_USER_AGENT ? userAgent : userAgent.substring(0, TAMANHO_USER_AGENT);
    }
}
