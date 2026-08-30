package com.siszoo.usuarios.dto;

import jakarta.validation.constraints.Size;

public record AtualizarPerfilRequest(
        @Size(max = 20, message = "Telefone deve ter no maximo 20 caracteres")
        String telefone) {
}
