package com.siszoo.usuarios.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record SolicitarRecuperacaoSenhaRequest(
        @NotBlank
        @Pattern(regexp = "^[a-z.]+@itu\\.sp\\.gov\\.br$", message = "Use o e-mail institucional (@itu.sp.gov.br).")
        String email) {
}
