package com.siszoo.usuarios.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

// Mesmo formato do e-mail do login: a mensagem de formato nao revela se o
// endereco existe, so que ele nao e institucional.
public record SolicitarRecuperacaoSenhaRequest(
        @NotBlank
        @Pattern(regexp = "^[a-z.]+@itu\\.sp\\.gov\\.br$", message = "Use o e-mail institucional (@itu.sp.gov.br).")
        String email) {
}
