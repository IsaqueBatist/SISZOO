package com.siszoo.animais.clinico.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

// Sem `codigo`: ele e derivado do nome no servidor (VacinaService.derivarCodigo)
// e imutavel depois de criado, porque e a chave usada por
// VacinacaoService.resolverVacina e ja sai nas respostas como `vacinaCodigo`.
public record CriarVacinaRequest(
        @NotBlank
        @Size(max = 100)
        String nome,

        // Nulo e valido: vacina sem intervalo definido nao gera alerta de
        // reforco (RN-A03) — a coluna intervalo_meses e nullable na V5.
        // O teto existe porque Vacinacao.calcularDataValidade faz
        // dataAplicacao.plusMonths(n): um valor absurdo estoura o LocalDate e
        // viraria 500. 1200 = 100 anos.
        @Positive
        @Max(1200)
        Integer intervaloMeses) {
}
