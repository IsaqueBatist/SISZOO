package com.siszoo.processos.service;

import java.time.Clock;
import java.time.LocalDate;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.siszoo.comum.service.ProtocoloService;
import com.siszoo.ocorrencias.entity.Ocorrencia;
import com.siszoo.ocorrencias.exception.DataAberturaFuturaException;
import com.siszoo.ocorrencias.service.OcorrenciaService;
import com.siszoo.ocorrencias.service.PermissoesOcorrencia;
import com.siszoo.processos.dto.AlterarStatusProcessoRequest;
import com.siszoo.processos.dto.CriarProcessoRequest;
import com.siszoo.processos.dto.ProcessoSanitarioResponse;
import com.siszoo.processos.entity.ProcessoSanitario;
import com.siszoo.processos.entity.StatusProcesso;
import com.siszoo.processos.exception.ProcessoNaoEncontradoException;
import com.siszoo.processos.exception.TransicaoStatusProcessoInvalidaException;
import com.siszoo.processos.repository.ProcessoSanitarioRepository;
import com.siszoo.usuarios.entity.AcaoAuditoria;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.exception.UsuarioNaoEncontradoException;
import com.siszoo.usuarios.repository.UsuarioRepository;
import com.siszoo.usuarios.service.AuditoriaEventoService;

// Processo sanitario minimo (T25, D2/D3/D18): criacao com vinculo opcional a
// ocorrencia e avanco de status. O resto do modulo (doenca, laboratorio,
// resultado, notificacao) fica para a task de processos.
@Service
public class ProcessoSanitarioService {

    private static final String ENTIDADE_AUDITORIA = "processo_sanitario";

    private final ProcessoSanitarioRepository processoRepository;
    private final UsuarioRepository usuarioRepository;
    private final OcorrenciaService ocorrenciaService;
    private final ProtocoloService protocoloService;
    private final AuditoriaEventoService auditoriaEventoService;
    private final Clock clock;

    public ProcessoSanitarioService(
            ProcessoSanitarioRepository processoRepository,
            UsuarioRepository usuarioRepository,
            OcorrenciaService ocorrenciaService,
            ProtocoloService protocoloService,
            AuditoriaEventoService auditoriaEventoService,
            Clock clock) {
        this.processoRepository = processoRepository;
        this.usuarioRepository = usuarioRepository;
        this.ocorrenciaService = ocorrenciaService;
        this.protocoloService = protocoloService;
        this.auditoriaEventoService = auditoriaEventoService;
        this.clock = clock;
    }

    @Transactional
    public ProcessoSanitarioResponse criar(CriarProcessoRequest request, PermissoesOcorrencia permissoes) {
        // Mesma regra da ocorrencia (D21): com o Clock do projeto, nao com @PastOrPresent.
        if (request.dataAbertura().isAfter(LocalDate.now(clock))) {
            throw new DataAberturaFuturaException();
        }
        Usuario autor = usuarioRepository.findById(permissoes.usuarioId())
                .orElseThrow(UsuarioNaoEncontradoException::new);

        // D33: com ocorrenciaId, a escrita em ocorrencias e checada ANTES de
        // inserir o processo — sem ela, nada e criado. A ocorrencia e travada
        // antes do processo existir (ordem global de locks, ver OcorrenciaService).
        Ocorrencia ocorrencia = null;
        if (request.ocorrenciaId() != null) {
            ocorrenciaService.exigirEscritaEmOcorrencias(permissoes);
            ocorrencia = ocorrenciaService.travarParaVinculo(request.ocorrenciaId());
        }

        ProcessoSanitario processo = new ProcessoSanitario();
        processo.setProtocolo(protocoloService.proximo(ProtocoloService.Entidade.PROCESSO));
        processo.setDataAbertura(request.dataAbertura());
        processo.setUrgente(request.isUrgente());
        processo.setCriadoPor(autor);
        processoRepository.save(processo);

        if (ocorrencia != null) {
            ocorrenciaService.vincular(ocorrencia, processo, autor);
        }

        ProcessoSanitarioResponse response = toResponse(processo);
        auditoriaEventoService.registrar(autor, AcaoAuditoria.CRIACAO, ENTIDADE_AUDITORIA, processo.getId(), null, response);
        return response;
    }

    @Transactional(readOnly = true)
    public ProcessoSanitarioResponse buscarPorId(UUID id) {
        return toResponse(processoRepository.findById(id).orElseThrow(ProcessoNaoEncontradoException::new));
    }

    // Placeholder (D18): so avanca um passo por vez, sem campo de resultado e
    // sem notificacao por e-mail. A task de processos substitui este fluxo.
    @Transactional
    public ProcessoSanitarioResponse alterarStatus(UUID id, AlterarStatusProcessoRequest request, UUID usuarioId) {
        ProcessoSanitario processo = processoRepository.findByIdForUpdate(id)
                .orElseThrow(ProcessoNaoEncontradoException::new);
        StatusProcesso proximo = processo.getStatusProcesso().proximo()
                .orElseThrow(TransicaoStatusProcessoInvalidaException::new);
        if (request.status() != proximo) {
            throw new TransicaoStatusProcessoInvalidaException();
        }
        Usuario autor = usuarioRepository.findById(usuarioId).orElseThrow(UsuarioNaoEncontradoException::new);
        ProcessoSanitarioResponse antes = toResponse(processo);

        processo.setStatusProcesso(proximo);
        processoRepository.saveAndFlush(processo);

        ProcessoSanitarioResponse response = toResponse(processo);
        auditoriaEventoService.registrar(autor, AcaoAuditoria.ATUALIZACAO, ENTIDADE_AUDITORIA, id, antes, response);
        return response;
    }

    private static ProcessoSanitarioResponse toResponse(ProcessoSanitario processo) {
        return new ProcessoSanitarioResponse(
                processo.getId(),
                processo.getProtocolo(),
                processo.getDataAbertura(),
                processo.getOcorrencia() == null ? null : processo.getOcorrencia().getId(),
                processo.isUrgente(),
                processo.getStatusProcesso(),
                processo.getCriadoEm());
    }
}
