package com.siszoo.usuarios.service;

import java.time.Clock;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.task.TaskRejectedException;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.siszoo.comum.exception.CampoInvalidoException;
import com.siszoo.comum.service.EmailService;
import com.siszoo.comum.service.EmailTemplateService;
import com.siszoo.usuarios.dto.RedefinirSenhaComTokenRequest;
import com.siszoo.usuarios.entity.AcaoAuditoria;
import com.siszoo.usuarios.entity.MotivoEncerramentoSessao;
import com.siszoo.usuarios.entity.TokenRecuperacaoSenha;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.exception.SenhasDivergentesException;
import com.siszoo.usuarios.exception.TokenRecuperacaoInvalidoException;
import com.siszoo.usuarios.repository.TokenRecuperacaoSenhaRepository;
import com.siszoo.usuarios.repository.UsuarioRepository;

@Service
public class RecuperacaoSenhaService {

    static final String TEMPLATE_EMAIL = "email/recuperacao-senha";
    static final String ASSUNTO_EMAIL = "SISZOO - Redefinição de senha";
    static final String ROTA_REDEFINICAO = "/redefinir-senha?token=";
    static final Duration RETENCAO_APOS_VENCIMENTO = Duration.ofDays(7);

    private static final Logger log = LoggerFactory.getLogger(RecuperacaoSenhaService.class);

    private final UsuarioRepository usuarioRepository;
    private final TokenRecuperacaoSenhaRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final EmailTemplateService emailTemplateService;
    private final SessaoService sessaoService;
    private final AuditoriaEventoService auditoriaEventoService;
    private final LimitadorRecuperacaoSenha limitador;
    private final Clock clock;
    private final String urlAplicacao;
    private final Duration validade;

    public RecuperacaoSenhaService(
            UsuarioRepository usuarioRepository,
            TokenRecuperacaoSenhaRepository tokenRepository,
            PasswordEncoder passwordEncoder,
            EmailService emailService,
            EmailTemplateService emailTemplateService,
            SessaoService sessaoService,
            AuditoriaEventoService auditoriaEventoService,
            LimitadorRecuperacaoSenha limitador,
            Clock clock,
            @Value("${siszoo.app.url}") String urlAplicacao,
            @Value("${siszoo.recuperacao-senha.validade-minutos}") long validadeMinutos) {
        this.usuarioRepository = usuarioRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.emailTemplateService = emailTemplateService;
        this.sessaoService = sessaoService;
        this.auditoriaEventoService = auditoriaEventoService;
        this.limitador = limitador;
        this.clock = clock;
        this.urlAplicacao = semBarraFinal(urlAplicacao);
        this.validade = Duration.ofMinutes(validadeMinutos);
    }

    @Transactional
    public void solicitar(String email, String ip) {
        limitador.registrarSolicitacao(email, ip);
        String destino = EmailService.mascarar(email);
        Optional<Usuario> conta = usuarioRepository.findByEmail(normalizar(email)).filter(Usuario::isAtivo);
        if (conta.isEmpty()) {
            log.info("Recuperacao de senha solicitada para {} sem conta ativa; nada enviado", destino);
            return;
        }
        Usuario usuario = conta.get();
        LocalDateTime agora = agora();
        tokenRepository.invalidarPendentesDoUsuario(usuario.getId(), agora);

        String token = TokenOpaco.novo();
        TokenRecuperacaoSenha registro = new TokenRecuperacaoSenha();
        registro.setUsuario(usuario);
        registro.setTokenHash(TokenOpaco.hash(token));
        registro.setCriadoEm(agora);
        registro.setExpiraEm(agora.plus(validade));
        registro.setIpSolicitacao(ip);
        tokenRepository.save(registro);

        String link = urlAplicacao + ROTA_REDEFINICAO + token;
        aposCommit(() -> enviarEmail(usuario, link, destino));
    }

    @Transactional(readOnly = true)
    public void validar(String token, String ip) {
        limitador.registrarConsumo(ip);
        tokenRepository.buscarPorHash(TokenOpaco.hash(token))
                .filter(this::pendenteDeUsuarioAtivo)
                .orElseThrow(TokenRecuperacaoInvalidoException::new);
    }

    @Transactional
    public void redefinir(RedefinirSenhaComTokenRequest request, String ip) {
        limitador.registrarConsumo(ip);
        if (!request.novaSenha().equals(request.confirmarSenha())) {
            throw new SenhasDivergentesException();
        }
        TokenRecuperacaoSenha token = tokenRepository.buscarPorHashParaAtualizar(TokenOpaco.hash(request.token()))
                .filter(this::pendenteDeUsuarioAtivo)
                .orElseThrow(TokenRecuperacaoInvalidoException::new);
        Usuario usuario = token.getUsuario();

        PoliticaSenha.violacao(request.novaSenha(), usuario.getEmail(), usuario.getNome(), usuario.getSobrenome())
                .ifPresent(mensagem -> {
                    throw new CampoInvalidoException("novaSenha", mensagem);
                });
        if (passwordEncoder.matches(request.novaSenha(), usuario.getSenha())) {
            throw new CampoInvalidoException("novaSenha", "A nova senha precisa ser diferente da senha atual.");
        }

        LocalDateTime alteradaAntes = usuario.getSenhaAlteradaEm();
        LocalDateTime alteradaAgora = agora().truncatedTo(ChronoUnit.MICROS);
        usuario.setSenha(passwordEncoder.encode(request.novaSenha()));
        usuario.setSenhaAlteradaEm(alteradaAgora);
        usuarioRepository.save(usuario);

        token.setUsadoEm(alteradaAgora);
        tokenRepository.invalidarOutrosPendentesDoUsuario(usuario.getId(), token.getId(), alteradaAgora);
        sessaoService.encerrarDoUsuario(usuario.getId(), MotivoEncerramentoSessao.SENHA_ALTERADA, null);

        auditoriaEventoService.registrar(usuario, AcaoAuditoria.ATUALIZACAO, "usuario", usuario.getId(),
                Collections.singletonMap("senhaAlteradaEm", alteradaAntes),
                Map.of("senhaAlteradaEm", alteradaAgora, "recuperacaoPorEmail", true));
        log.info("Senha redefinida por link de recuperacao para {}", EmailService.mascarar(usuario.getEmail()));
    }

    @Transactional
    public void invalidarPendentes(UUID usuarioId) {
        tokenRepository.invalidarPendentesDoUsuario(usuarioId, agora());
    }

    @Scheduled(cron = "0 15 3 * * *", zone = "America/Sao_Paulo")
    @Transactional
    public void expurgarVencidos() {
        int apagados = tokenRepository.apagarExpiradosAntesDe(agora().minus(RETENCAO_APOS_VENCIMENTO));
        if (apagados > 0) {
            log.info("Expurgo de tokens de recuperacao de senha: {} removidos", apagados);
        }
    }

    private boolean pendenteDeUsuarioAtivo(TokenRecuperacaoSenha token) {
        return token.pendenteEm(agora()) && token.getUsuario().isAtivo();
    }

    private void enviarEmail(Usuario usuario, String link, String destinoMascarado) {
        Map<String, Object> variaveis = Map.of(
                "nome", usuario.getNome(),
                "link", link,
                "validadeMinutos", validade.toMinutes());
        try {
            emailService.enviar(
                    usuario.getEmail(),
                    ASSUNTO_EMAIL,
                    emailTemplateService.renderizarHtml(TEMPLATE_EMAIL, variaveis),
                    emailTemplateService.renderizarTexto(TEMPLATE_EMAIL, variaveis));
            log.info("Link de recuperacao de senha enviado para {}", destinoMascarado);
        } catch (TaskRejectedException ex) {
            log.warn("Link de recuperacao de senha para {} nao submetido: executor recusou a tarefa", destinoMascarado);
            log.debug("Detalhes da recusa do envio do link de recuperacao", ex);
        }
    }

    private static void aposCommit(Runnable acao) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            acao.run();
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                acao.run();
            }
        });
    }

    private LocalDateTime agora() {
        return LocalDateTime.now(clock);
    }

    private static String normalizar(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static String semBarraFinal(String url) {
        String base = url.trim();
        return base.endsWith("/") ? base.substring(0, base.length() - 1) : base;
    }
}
