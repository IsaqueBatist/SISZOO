package com.siszoo.usuarios.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AtualizarUsuarioRequest(
        @NotBlank(message = "Informe o nome.")
        @Size(max = 100, message = "O nome deve ter no máximo 100 caracteres.")
        String nome,

        @NotBlank(message = "Informe o sobrenome.")
        @Size(max = 100, message = "O sobrenome deve ter no máximo 100 caracteres.")
        String sobrenome,

        @NotBlank(message = "Selecione o perfil.")
        String cargo,

        @Size(max = 20, message = "O CRMV deve ter no máximo 20 caracteres.")
        String crmv,

        @Size(max = 20, message = "O telefone deve ter no máximo 20 caracteres.")
        String telefone) {
}
