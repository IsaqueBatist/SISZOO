package com.siszoo.ocorrencias.mapper;

import java.util.List;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import com.siszoo.ocorrencias.dto.AnexoOcorrenciaResponse;
import com.siszoo.ocorrencias.dto.DenunciadoResponse;
import com.siszoo.ocorrencias.dto.DenuncianteResponse;
import com.siszoo.ocorrencias.dto.MovimentacaoOcorrenciaResponse;
import com.siszoo.ocorrencias.dto.OcorrenciaAuditoriaSnapshot;
import com.siszoo.ocorrencias.dto.OcorrenciaResponse;
import com.siszoo.ocorrencias.dto.OcorrenciaResumoResponse;
import com.siszoo.ocorrencias.dto.ProcessoVinculadoResponse;
import com.siszoo.ocorrencias.entity.AnexoOcorrencia;
import com.siszoo.ocorrencias.entity.Denunciado;
import com.siszoo.ocorrencias.entity.Denunciante;
import com.siszoo.ocorrencias.entity.MovimentacaoOcorrencia;
import com.siszoo.ocorrencias.entity.Ocorrencia;
import com.siszoo.processos.entity.ProcessoSanitario;
import com.siszoo.usuarios.entity.Usuario;

@Mapper(componentModel = "spring")
public interface OcorrenciaMapper {

    // Mascara do denunciante (D14): em ocorrencia sigilosa, quem nao tem
    // OCORRENCIAS_DENUNCIAS:denunciante_sigiloso:leitura recebe o bloco com
    // todos os campos null. O denunciado nunca e mascarado.
    DenuncianteResponse DENUNCIANTE_MASCARADO = new DenuncianteResponse(null, null, null, null, null, null, null);

    DenuncianteResponse toDenuncianteResponse(Denunciante denunciante);

    DenunciadoResponse toDenunciadoResponse(Denunciado denunciado);

    @Mapping(target = "usuarioId", source = "usuario.id")
    @Mapping(target = "usuarioNome", source = "usuario", qualifiedByName = "nomeCompleto")
    MovimentacaoOcorrenciaResponse toMovimentacaoResponse(MovimentacaoOcorrencia movimentacao);

    AnexoOcorrenciaResponse toAnexoResponse(AnexoOcorrencia anexo);

    ProcessoVinculadoResponse toProcessoVinculadoResponse(ProcessoSanitario processo);

    @Named("nomeCompleto")
    default String nomeCompleto(Usuario usuario) {
        return usuario == null ? null : usuario.getNome() + " " + usuario.getSobrenome();
    }

    default DenuncianteResponse denuncianteVisivel(Ocorrencia ocorrencia, Denunciante denunciante, boolean podeVerSigilo) {
        if (denunciante == null) {
            return null;
        }
        return ocorrencia.isSigilosa() && !podeVerSigilo ? DENUNCIANTE_MASCARADO : toDenuncianteResponse(denunciante);
    }

    default OcorrenciaResponse toResponse(Ocorrencia ocorrencia, Denunciante denunciante, Denunciado denunciado,
            ProcessoSanitario processo, List<MovimentacaoOcorrencia> movimentacoes, List<AnexoOcorrencia> anexos,
            boolean podeVerSigilo) {
        return new OcorrenciaResponse(
                ocorrencia.getId(),
                ocorrencia.getProtocolo(),
                ocorrencia.getTipoOcorrencia().getCodigo(),
                ocorrencia.getTipoOcorrencia().getNome(),
                ocorrencia.getStatusOcorrencia(),
                ocorrencia.getDataAbertura(),
                ocorrencia.getHoraAbertura(),
                ocorrencia.getEndereco(),
                ocorrencia.getBairro(),
                ocorrencia.getPontoReferencia(),
                ocorrencia.getDescricao(),
                ocorrencia.isUrgente(),
                ocorrencia.isSigilosa(),
                ocorrencia.isAnonima(),
                ocorrencia.getLatitude(),
                ocorrencia.getLongitude(),
                ocorrencia.getRegistradoPor().getId(),
                nomeCompleto(ocorrencia.getRegistradoPor()),
                ocorrencia.getProvidenciaTomada() == null ? null : ocorrencia.getProvidenciaTomada().getCodigo(),
                ocorrencia.getProvidenciaTomada() == null ? null : ocorrencia.getProvidenciaTomada().getNome(),
                ocorrencia.getDescricaoEncerramento(),
                ocorrencia.getEncerradaEm(),
                nomeCompleto(ocorrencia.getEncerradaPor()),
                processo == null ? null : toProcessoVinculadoResponse(processo),
                denuncianteVisivel(ocorrencia, denunciante, podeVerSigilo),
                denunciado == null ? null : toDenunciadoResponse(denunciado),
                movimentacoes.stream().map(this::toMovimentacaoResponse).toList(),
                anexos.stream().map(this::toAnexoResponse).toList(),
                podeVerSigilo,
                ocorrencia.getCriadoEm(),
                ocorrencia.getAtualizadoEm());
    }

    default OcorrenciaResumoResponse toResumo(Ocorrencia ocorrencia, Denunciante denunciante,
            ProcessoSanitario processo, boolean podeVerSigilo) {
        DenuncianteResponse visivel = denuncianteVisivel(ocorrencia, denunciante, podeVerSigilo);
        return new OcorrenciaResumoResponse(
                ocorrencia.getId(),
                ocorrencia.getProtocolo(),
                ocorrencia.getTipoOcorrencia().getCodigo(),
                ocorrencia.getTipoOcorrencia().getNome(),
                ocorrencia.getStatusOcorrencia(),
                ocorrencia.getDataAbertura(),
                ocorrencia.getBairro(),
                ocorrencia.isUrgente(),
                ocorrencia.isSigilosa(),
                ocorrencia.isAnonima(),
                visivel == null ? null : visivel.nome(),
                processo == null ? null : processo.getProtocolo(),
                podeVerSigilo);
    }

    // D23: nenhum dado pessoal do denunciante entra na auditoria.
    default OcorrenciaAuditoriaSnapshot toSnapshot(Ocorrencia ocorrencia, boolean denuncianteAlterado) {
        return new OcorrenciaAuditoriaSnapshot(
                ocorrencia.getId(),
                ocorrencia.getProtocolo(),
                ocorrencia.getTipoOcorrencia().getCodigo(),
                ocorrencia.getStatusOcorrencia(),
                ocorrencia.getDataAbertura(),
                ocorrencia.getHoraAbertura(),
                ocorrencia.getEndereco(),
                ocorrencia.getBairro(),
                ocorrencia.getPontoReferencia(),
                ocorrencia.getDescricao(),
                ocorrencia.isUrgente(),
                ocorrencia.isSigilosa(),
                ocorrencia.isAnonima(),
                ocorrencia.getLatitude(),
                ocorrencia.getLongitude(),
                ocorrencia.getProvidenciaTomada() == null ? null : ocorrencia.getProvidenciaTomada().getCodigo(),
                ocorrencia.getDescricaoEncerramento(),
                ocorrencia.getEncerradaEm(),
                denuncianteAlterado);
    }
}
