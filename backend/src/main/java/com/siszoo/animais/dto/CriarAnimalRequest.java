package com.siszoo.animais.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CriarAnimalRequest(
        @NotBlank
        @Size(max = 80)
        String nome,

        @NotBlank
        String especie,

        @NotBlank
        @Pattern(regexp = "^(macho|femea|nao_identificado)$", message = "Sexo deve ser macho, femea ou nao_identificado")
        String sexo,

        @Size(max = 80)
        String raca,

        @Size(max = 80)
        String coloracao,

        @Pattern(regexp = "^(curta|longa)$", message = "Pelagem deve ser curta ou longa")
        String pelagem,

        @Pattern(regexp = "^(pequeno|medio|grande)$", message = "Porte deve ser pequeno, medio ou grande")
        String porte,

        @DecimalMin(value = "0.0", inclusive = false, message = "Peso deve ser maior que zero")
        BigDecimal pesoKg,

        @Size(max = 30)
        String idadeAprox,

        LocalDate dataNascimentoAprox,

        @Size(max = 30)
        String microchip,

        boolean esterilizado,

        LocalDate dataEsterilizacao,

        @NotBlank
        String status,

        @NotBlank
        String motivoEntrada,

        @NotNull
        LocalDateTime dataEntrada,

        UUID baiaId,

        String fotoUrl,

        String observacoes) {
}
