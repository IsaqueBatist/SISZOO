package com.siszoo.usuarios.dto;

import com.siszoo.comum.validacao.TamanhoMaximoBytes;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CriarUsuarioRequest(
        @NotBlank
        String nome,

        @NotBlank
        String sobrenome,

        @NotBlank
        @Pattern(regexp = "^[a-z.]+@itu\\.sp\\.gov\\.br$", message = "Use o e-mail institucional (@itu.sp.gov.br).")
        String email,

        @NotBlank
        String cargo,

        String crmv,

        String telefone,

        @NotBlank
        @Size(min = 8, message = "A senha inicial deve ter no mínimo 8 caracteres.")
        @TamanhoMaximoBytes(value = 72, message = "A senha inicial deve ter no máximo 72 bytes (letras acentuadas contam como 2).")
        String senhaInicial) {
}
