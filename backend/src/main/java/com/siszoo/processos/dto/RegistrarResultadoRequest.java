package com.siszoo.processos.dto;

import jakarta.validation.constraints.NotBlank;

// Codigos de catalogo, como ja e o padrao de doenca/laboratorio em
// CriarProcessoRequest. desfechoAnimal e opcional (DER §3.5).
public record RegistrarResultadoRequest(
        @NotBlank
        String resultadoLaboratorial,
        String desfechoAnimal) {
}
