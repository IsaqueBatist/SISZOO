package com.siszoo.usuarios.dto;

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
        String senhaInicial) {
}
