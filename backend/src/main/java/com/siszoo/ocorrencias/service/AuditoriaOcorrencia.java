package com.siszoo.ocorrencias.service;

import java.util.Map;

import org.springframework.stereotype.Component;

import com.siszoo.ocorrencias.dto.OcorrenciaAuditoriaSnapshot;
import com.siszoo.ocorrencias.entity.MovimentacaoOcorrencia;
import com.siszoo.ocorrencias.entity.Ocorrencia;
import com.siszoo.ocorrencias.mapper.OcorrenciaMapper;
import com.siszoo.usuarios.entity.AcaoAuditoria;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.service.AuditoriaEventoService;

@Component
public class AuditoriaOcorrencia {

    private static final String ENTIDADE_OCORRENCIA = "ocorrencia";
    private static final String ENTIDADE_MOVIMENTACAO = "movimentacao_ocorrencia";

    private final OcorrenciaMapper ocorrenciaMapper;
    private final AuditoriaEventoService auditoriaEventoService;

    public AuditoriaOcorrencia(OcorrenciaMapper ocorrenciaMapper, AuditoriaEventoService auditoriaEventoService) {
        this.ocorrenciaMapper = ocorrenciaMapper;
        this.auditoriaEventoService = auditoriaEventoService;
    }

    public OcorrenciaAuditoriaSnapshot snapshot(Ocorrencia ocorrencia) {
        return ocorrenciaMapper.toSnapshot(ocorrencia, false);
    }

    public void registrar(Usuario autor, AcaoAuditoria acao, Ocorrencia ocorrencia,
            OcorrenciaAuditoriaSnapshot antes, boolean denuncianteAlterado) {
        auditoriaEventoService.registrar(autor, acao, ENTIDADE_OCORRENCIA, ocorrencia.getId(),
                antes, ocorrenciaMapper.toSnapshot(ocorrencia, denuncianteAlterado));
    }

    public void registrarNota(Usuario autor, MovimentacaoOcorrencia nota) {
        auditoriaEventoService.registrar(autor, AcaoAuditoria.CRIACAO, ENTIDADE_MOVIMENTACAO, nota.getId(), null,
                Map.of("ocorrenciaId", nota.getOcorrencia().getId(), "tipoMovimentacao", nota.getTipoMovimentacao()));
    }
}
