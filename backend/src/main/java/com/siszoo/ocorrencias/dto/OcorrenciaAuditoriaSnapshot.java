package com.siszoo.ocorrencias.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

import com.siszoo.ocorrencias.entity.StatusOcorrencia;

// Payload de auditoria da ocorrencia (D23): sem nenhum dado pessoal do
// denunciante. So registra se o bloco do denunciante foi alterado.
public record OcorrenciaAuditoriaSnapshot(
        UUID id,
        String protocolo,
        String tipoOcorrencia,
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
        String providenciaTomada,
        String descricaoEncerramento,
        LocalDateTime encerradaEm,
        boolean denuncianteAlterado) {
}
