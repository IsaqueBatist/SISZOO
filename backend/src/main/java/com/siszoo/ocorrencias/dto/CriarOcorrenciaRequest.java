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

// dataAbertura futura e barrada no service com o Clock do projeto (D21), nao
// com @PastOrPresent (ver VacinacaoService, RN-C06). As flags sao Boolean e
// opcionais (ausente = false): o Jackson 3 recusa null em boolean primitivo.
public record CriarOcorrenciaRequest(
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

        Boolean urgente,

        Boolean sigilosa,

        Boolean anonima,

        @DecimalMin("-90") @DecimalMax("90")
        BigDecimal latitude,

        @DecimalMin("-180") @DecimalMax("180")
        BigDecimal longitude,

        @Valid
        DenuncianteRequest denunciante,

        @Valid
        DenunciadoRequest denunciado) {

    public boolean isUrgente() {
        return Boolean.TRUE.equals(urgente);
    }

    public boolean isSigilosa() {
        return Boolean.TRUE.equals(sigilosa);
    }

    public boolean isAnonima() {
        return Boolean.TRUE.equals(anonima);
    }
}
