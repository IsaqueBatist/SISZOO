package com.siszoo.ocorrencias.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AtualizarOcorrenciaRequest(
        @NotBlank
        String tipoOcorrencia,

        @NotNull
        LocalDate dataAbertura,

        LocalTime horaAbertura,

        @NotBlank
        @Size(max = 255)
        String endereco,

        @NotBlank
        @Size(max = 80)
        String bairro,

        @Size(max = 255)
        String pontoReferencia,

        @NotBlank
        String descricao,

        @NotNull
        Boolean urgente,

        @NotNull
        Boolean sigilosa,

        @NotNull
        Boolean anonima,

        @DecimalMin("-90") @DecimalMax("90")
        BigDecimal latitude,

        @DecimalMin("-180") @DecimalMax("180")
        BigDecimal longitude,

        @Valid
        DenuncianteRequest denunciante,

        @Valid
        DenunciadoRequest denunciado) {
}
