package com.siszoo.usuarios.dto;

import com.siszoo.comum.validacao.TamanhoMaximoBytes;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RedefinirSenhaRequest(
        @NotBlank(message = "Informe a senha temporária.")
        @Size(min = 8, message = "A senha temporária deve ter no mínimo 8 caracteres.")
        @TamanhoMaximoBytes(value = 72, message = "A senha temporária deve ter no máximo 72 bytes (letras acentuadas contam como 2).")
        String senhaTemporaria) {
}
