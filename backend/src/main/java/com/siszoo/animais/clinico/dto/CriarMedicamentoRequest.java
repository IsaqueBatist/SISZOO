package com.siszoo.animais.clinico.dto;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CriarMedicamentoRequest(
        @NotBlank
        @Size(max = 100)
        String nome,

        // CategoriaFarmacologica nao tem `codigo` (ao contrario de Vacina/
        // TipoProcedimento): referenciada por uuid cru, mesmo padrao usado por
        // Prescricao.medicamentoId (ver comentario em V5__schema_clinico_catalogos.sql).
        @NotNull
        UUID categoriaId) {
}
