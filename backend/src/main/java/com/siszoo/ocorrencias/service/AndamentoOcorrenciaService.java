package com.siszoo.ocorrencias.service;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.siszoo.ocorrencias.dto.AlterarStatusOcorrenciaRequest;
import com.siszoo.ocorrencias.dto.CriarNotaRequest;
import com.siszoo.ocorrencias.dto.EncerrarOcorrenciaRequest;
import com.siszoo.ocorrencias.dto.OcorrenciaResponse;
import com.siszoo.ocorrencias.entity.MovimentacaoOcorrencia;
import com.siszoo.ocorrencias.entity.Ocorrencia;
import com.siszoo.ocorrencias.entity.ProvidenciaTomada;
import com.siszoo.ocorrencias.entity.StatusOcorrencia;
import com.siszoo.ocorrencias.entity.TipoMovimentacaoOcorrencia;
import com.siszoo.ocorrencias.event.OcorrenciaEncerradaEvent;
import com.siszoo.ocorrencias.exception.DescricaoEncerramentoObrigatoriaException;
import com.siszoo.ocorrencias.exception.OcorrenciaNaoEncontradaException;
import com.siszoo.ocorrencias.exception.ProvidenciaInvalidaException;
import com.siszoo.ocorrencias.exception.ProvidenciaObrigatoriaException;
import com.siszoo.ocorrencias.exception.TransicaoStatusInvalidaException;
import com.siszoo.ocorrencias.repository.OcorrenciaRepository;
import com.siszoo.ocorrencias.repository.ProvidenciaTomadaRepository;
import com.siszoo.usuarios.entity.AcaoAuditoria;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.exception.UsuarioNaoEncontradoException;
import com.siszoo.usuarios.repository.UsuarioRepository;

@Service
public class AndamentoOcorrenciaService {

    private final OcorrenciaRepository ocorrenciaRepository;
    private final ProvidenciaTomadaRepository providenciaTomadaRepository;
    private final UsuarioRepository usuarioRepository;
    private final VinculoOcorrenciaService vinculos;
    private final RegistroMovimentacaoOcorrencia movimentacoes;
    private final AuditoriaOcorrencia auditoria;
    private final MontadorRespostaOcorrencia montadorResposta;
    private final ApplicationEventPublisher eventPublisher;
    private final Clock clock;

    public AndamentoOcorrenciaService(
            OcorrenciaRepository ocorrenciaRepository,
            ProvidenciaTomadaRepository providenciaTomadaRepository,
            UsuarioRepository usuarioRepository,
            VinculoOcorrenciaService vinculos,
            RegistroMovimentacaoOcorrencia movimentacoes,
            AuditoriaOcorrencia auditoria,
            MontadorRespostaOcorrencia montadorResposta,
            ApplicationEventPublisher eventPublisher,
            Clock clock) {
        this.ocorrenciaRepository = ocorrenciaRepository;
        this.providenciaTomadaRepository = providenciaTomadaRepository;
        this.usuarioRepository = usuarioRepository;
        this.vinculos = vinculos;
        this.movimentacoes = movimentacoes;
        this.auditoria = auditoria;
        this.montadorResposta = montadorResposta;
        this.eventPublisher = eventPublisher;
        this.clock = clock;
    }

    @Transactional
    public OcorrenciaResponse alterarStatus(UUID id, AlterarStatusOcorrenciaRequest request, PermissoesOcorrencia permissoes) {
        if (request.status() != StatusOcorrencia.EM_ATENDIMENTO) {
            throw new TransicaoStatusInvalidaException();
        }
        Ocorrencia ocorrencia = travar(id);
        Usuario autor = buscarUsuario(permissoes.usuarioId());
        var antes = auditoria.snapshot(ocorrencia);

        StatusOcorrencia anterior = ocorrencia.iniciarAtendimento();
        movimentacoes.registrar(ocorrencia, autor, TipoMovimentacaoOcorrencia.EQUIPE_DESPACHADA,
                anterior, ocorrencia.getStatusOcorrencia(), null);
        ocorrenciaRepository.saveAndFlush(ocorrencia);
        auditoria.registrar(autor, AcaoAuditoria.ATUALIZACAO, ocorrencia, antes, false);

        return montadorResposta.paraMutacao(ocorrencia, permissoes);
    }

    @Transactional
    public OcorrenciaResponse encerrar(UUID id, EncerrarOcorrenciaRequest request, PermissoesOcorrencia permissoes) {
        if (!StringUtils.hasText(request.providenciaTomada())) {
            throw new ProvidenciaObrigatoriaException();
        }
        Ocorrencia ocorrencia = travar(id);
        if (ocorrencia.isEncerrada()) {
            throw new TransicaoStatusInvalidaException();
        }
        ProvidenciaTomada providencia = providenciaTomadaRepository.findByCodigo(request.providenciaTomada())
                .filter(ProvidenciaTomada::isAtivo)
                .orElseThrow(ProvidenciaInvalidaException::new);
        String descricao = StringUtils.hasText(request.descricaoEncerramento())
                ? request.descricaoEncerramento().trim()
                : null;
        if (ProvidenciaTomada.CODIGO_OUTRO.equals(providencia.getCodigo()) && descricao == null) {
            throw new DescricaoEncerramentoObrigatoriaException();
        }
        vinculos.exigirProcessoConcluido(id);

        Usuario autor = buscarUsuario(permissoes.usuarioId());
        var antes = auditoria.snapshot(ocorrencia);

        StatusOcorrencia anterior = ocorrencia.encerrar(providencia, descricao, LocalDateTime.now(clock), autor);
        movimentacoes.registrar(ocorrencia, autor, TipoMovimentacaoOcorrencia.ENCERRADA,
                anterior, ocorrencia.getStatusOcorrencia(), "Providência: " + providencia.getNome());
        ocorrenciaRepository.saveAndFlush(ocorrencia);
        auditoria.registrar(autor, AcaoAuditoria.ENCERRAMENTO, ocorrencia, antes, false);
        eventPublisher.publishEvent(new OcorrenciaEncerradaEvent(id, autor.getId()));

        return montadorResposta.paraMutacao(ocorrencia, permissoes);
    }

    @Transactional
    public OcorrenciaResponse adicionarNota(UUID id, CriarNotaRequest request, PermissoesOcorrencia permissoes) {
        Ocorrencia ocorrencia = travar(id);
        ocorrencia.exigirAberta();
        Usuario autor = buscarUsuario(permissoes.usuarioId());
        MovimentacaoOcorrencia nota = movimentacoes.registrar(ocorrencia, autor,
                TipoMovimentacaoOcorrencia.NOTA_INTERNA, null, null, request.descricao().trim());
        auditoria.registrarNota(autor, nota);
        return montadorResposta.paraMutacao(ocorrencia, permissoes);
    }

    private Ocorrencia travar(UUID id) {
        return ocorrenciaRepository.findByIdForUpdate(id).orElseThrow(OcorrenciaNaoEncontradaException::new);
    }

    private Usuario buscarUsuario(UUID usuarioId) {
        return usuarioRepository.findById(usuarioId).orElseThrow(UsuarioNaoEncontradoException::new);
    }
}
