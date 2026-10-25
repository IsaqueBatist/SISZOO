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
        @Pattern(regexp = "^[a-z.]+@itu\\.sp\\.gov\\.br$", message = "E-mail deve ser institucional (@itu.sp.gov.br)")
        String email,

        @NotBlank
        String cargo,

        String crmv,

        String telefone,

        @NotBlank
        @Size(min = 8, message = "Senha inicial deve ter no minimo 8 caracteres")
        @TamanhoMaximoBytes(value = 72, message = "Senha inicial deve ter no maximo 72 bytes (acentos contam 2)")
        String senhaInicial) {
}
