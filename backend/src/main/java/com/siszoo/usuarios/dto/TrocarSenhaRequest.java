package com.siszoo.usuarios.dto;

import com.siszoo.comum.validacao.TamanhoMaximoBytes;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// So novaSenha tem teto em bytes: e a unica que passa pelo BCrypt.encode
// (confirmarSenha so e comparada com ela).
public record TrocarSenhaRequest(
        @NotBlank
        @Size(min = 8, message = "Nova senha deve ter no minimo 8 caracteres")
        @TamanhoMaximoBytes(value = 72, message = "Nova senha deve ter no maximo 72 bytes (acentos contam 2)")
        String novaSenha,

        @NotBlank
        String confirmarSenha) {
}
