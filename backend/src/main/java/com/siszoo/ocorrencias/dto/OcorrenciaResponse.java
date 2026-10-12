package com.siszoo.ocorrencias.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import com.siszoo.ocorrencias.entity.StatusOcorrencia;

// podeVerDenunciante (P-D, opcao b): calculado pelo servidor a partir de
// OCORRENCIAS_DENUNCIAS:denunciante_sigiloso:leitura. O front usa o campo para
// decidir o que exibir; o backend continua sendo a fonte da verdade.
public record OcorrenciaResponse(
        UUID id,
        String protocolo,
        String tipoOcorrencia,
        String tipoOcorrenciaNome,
        StatusOcorrencia statusOcorrencia,
        LocalDate dataAbertura,
        LocalTime horaAbertura,
        String endereco,
        String bairro,
        String pontoReferencia,
        String descricao,
        boolean urgente,
        boolean sigilosa,
        boolean anonima,
        BigDecimal latitude,
        BigDecimal longitude,
        UUID registradoPorId,
        String registradoPorNome,
        String providenciaTomada,
        String providenciaTomadaNome,
        String descricaoEncerramento,
        LocalDateTime encerradaEm,
        String encerradaPorNome,
        ProcessoVinculadoResponse processoVinculado,
        DenuncianteResponse denunciante,
        DenunciadoResponse denunciado,
        List<MovimentacaoOcorrenciaResponse> movimentacoes,
        List<AnexoOcorrenciaResponse> anexos,
        boolean podeVerDenunciante,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm) {
}
