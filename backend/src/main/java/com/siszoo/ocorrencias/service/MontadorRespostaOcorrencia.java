package com.siszoo.ocorrencias.service;

import java.util.UUID;

import org.springframework.stereotype.Component;

import com.siszoo.ocorrencias.dto.OcorrenciaResponse;
import com.siszoo.ocorrencias.entity.Denunciante;
import com.siszoo.ocorrencias.entity.Ocorrencia;
import com.siszoo.ocorrencias.mapper.OcorrenciaMapper;
import com.siszoo.ocorrencias.repository.AnexoOcorrenciaRepository;
import com.siszoo.ocorrencias.repository.DenunciadoRepository;
import com.siszoo.ocorrencias.repository.DenuncianteRepository;
import com.siszoo.ocorrencias.repository.MovimentacaoOcorrenciaRepository;
import com.siszoo.processos.repository.ProcessoSanitarioRepository;

@Component
public class MontadorRespostaOcorrencia {

    private final OcorrenciaMapper ocorrenciaMapper;
    private final DenuncianteRepository denuncianteRepository;
    private final DenunciadoRepository denunciadoRepository;
    private final ProcessoSanitarioRepository processoRepository;
    private final MovimentacaoOcorrenciaRepository movimentacaoRepository;
    private final AnexoOcorrenciaRepository anexoRepository;

    public MontadorRespostaOcorrencia(
            OcorrenciaMapper ocorrenciaMapper,
            DenuncianteRepository denuncianteRepository,
            DenunciadoRepository denunciadoRepository,
            ProcessoSanitarioRepository processoRepository,
            MovimentacaoOcorrenciaRepository movimentacaoRepository,
            AnexoOcorrenciaRepository anexoRepository) {
        this.ocorrenciaMapper = ocorrenciaMapper;
        this.denuncianteRepository = denuncianteRepository;
        this.denunciadoRepository = denunciadoRepository;
        this.processoRepository = processoRepository;
        this.movimentacaoRepository = movimentacaoRepository;
        this.anexoRepository = anexoRepository;
    }

    public OcorrenciaResponse paraDetalhe(Ocorrencia ocorrencia, Denunciante denunciante,
            PermissoesOcorrencia permissoes) {
        return montar(ocorrencia, denunciante, permissoes, true);
    }

    public OcorrenciaResponse paraCriacao(Ocorrencia ocorrencia, PermissoesOcorrencia permissoes) {
        return montar(ocorrencia, denuncianteDe(ocorrencia), permissoes, true);
    }

    public OcorrenciaResponse paraMutacao(Ocorrencia ocorrencia, PermissoesOcorrencia permissoes) {
        return montar(ocorrencia, denuncianteDe(ocorrencia), permissoes, false);
    }

    private Denunciante denuncianteDe(Ocorrencia ocorrencia) {
        return denuncianteRepository.findByOcorrenciaId(ocorrencia.getId()).orElse(null);
    }

    private OcorrenciaResponse montar(Ocorrencia ocorrencia, Denunciante denunciante,
            PermissoesOcorrencia permissoes, boolean entregaDenunciante) {
        UUID id = ocorrencia.getId();
        return ocorrenciaMapper.toResponse(
                ocorrencia,
                denunciante,
                denunciadoRepository.findByOcorrenciaId(id).orElse(null),
                processoRepository.findByOcorrenciaId(id).orElse(null),
                movimentacaoRepository.findByOcorrenciaIdOrderByDataDescCriadoEmDesc(id),
                anexoRepository.findByOcorrenciaIdOrderByCriadoEmAsc(id),
                permissoes.podeVerSigilo(),
                entregaDenunciante);
    }
}
