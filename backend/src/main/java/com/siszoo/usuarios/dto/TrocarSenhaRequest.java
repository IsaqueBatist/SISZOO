package com.siszoo.usuarios.dto;

import com.siszoo.comum.validacao.TamanhoMaximoBytes;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// So novaSenha tem teto em bytes: e a unica que passa pelo BCrypt.encode
// (confirmarSenha so e comparada com ela).
public record TrocarSenhaRequest(
        @NotBlank
        @Size(min = 8, message = "A nova senha deve ter no mínimo 8 caracteres.")
        @TamanhoMaximoBytes(value = 72, message = "A nova senha deve ter no máximo 72 bytes (letras acentuadas contam como 2).")
        String novaSenha,

        @NotBlank
        String confirmarSenha) {
}
