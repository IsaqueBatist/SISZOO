package com.siszoo.usuarios.dto;

import jakarta.validation.constraints.Size;

public record AtualizarPerfilRequest(
        @Size(max = 20, message = "O telefone deve ter no máximo 20 caracteres.")
        String telefone) {
}
