package com.siszoo.animais.clinico.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

// Tambem sem `codigo`: renomear a vacina altera so o `nome`. O codigo e a
// chave dos registros ja gravados e nao muda (mesmo argumento do microchip na
// RN01).
//
// `ativo` existe aqui, diferente de AtualizarMedicamentoRequest: o codigo da
// vacina e derivado do nome, entao recadastrar uma vacina desativada daria 409
// sem saida — o usuario nao veria o registro inativo nem teria como reverter.
public record AtualizarVacinaRequest(
        @NotBlank
        @Size(max = 100)
        String nome,

        @Positive
        @Max(1200)
        Integer intervaloMeses,

        @NotNull
        Boolean ativo) {
}
