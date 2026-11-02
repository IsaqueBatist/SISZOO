package com.siszoo.processos.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.siszoo.processos.entity.MaterialBiologico;
import com.siszoo.processos.entity.NivelContato;
import com.siszoo.processos.entity.StatusClinicoAmostra;
import com.siszoo.processos.entity.TipoAbrigo;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AmostraAnimalRequest(
        UUID animalId,

        String especie,

        @Pattern(regexp = "^(macho|femea|nao_identificado)$", message = "Selecione o sexo: macho, fêmea ou não identificado.")
        String sexo,

        @Size(max = 80)
        String raca,

        @Size(max = 80)
        String coloracao,

        @Pattern(regexp = "^(curta|longa)$", message = "Selecione a pelagem: curta ou longa.")
        String pelagem,

        @Size(max = 30)
        String idadeAprox,

        @DecimalMin(value = "0.0", inclusive = false, message = "O peso deve ser maior que zero.")
        @Digits(integer = 3, fraction = 2)
        BigDecimal pesoKg,

        @NotNull
        StatusClinicoAmostra statusClinico,

        @NotNull
        TipoAbrigo tipoAbrigo,

        String alteracaoComportamental,

        @NotNull
        LocalDate dataColeta,

        @NotNull
        MaterialBiologico materialBiologico,

        Boolean contatoHumano,

        NivelContato nivelContato,

        Boolean agrediuHumano,

        String observacoes,

        List<@NotBlank String> sintomas) {

    public boolean temIdentificacao() {
        return especie != null || sexo != null || raca != null || coloracao != null
                || pelagem != null || idadeAprox != null || pesoKg != null;
    }

    public List<String> sintomasOuVazio() {
        return sintomas == null ? List.of() : sintomas;
    }
}
