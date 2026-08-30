package com.siszoo.usuarios.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TrocarSenhaRequest(
        @NotBlank
        @Size(min = 8, message = "Nova senha deve ter no minimo 8 caracteres")
        String novaSenha,

        @NotBlank
        String confirmarSenha) {
}
