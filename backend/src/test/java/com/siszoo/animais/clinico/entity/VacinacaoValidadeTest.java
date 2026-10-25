package com.siszoo.animais.clinico.entity;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;

import org.junit.jupiter.api.Test;

// Vacinacao#calcularDataValidade e a fonte unica da validade (RN-A01) para
// ficha, alerta vacinal, dashboard e relatorio de vacinacao.
class VacinacaoValidadeTest {

    private static Vacinacao vacinacao(LocalDate aplicacao, Integer intervaloMeses) {
        Vacina vacina = new Vacina();
        vacina.setIntervaloMeses(intervaloMeses);
        Vacinacao vacinacao = new Vacinacao();
        vacinacao.setVacina(vacina);
        vacinacao.setDataAplicacao(aplicacao);
        return vacinacao;
    }

    @Test
    void validadeEAAplicacaoMaisOIntervaloEmMeses() {
        assertThat(vacinacao(LocalDate.of(2026, 3, 10), 12).calcularDataValidade()).isEqualTo(LocalDate.of(2027, 3, 10));
        // Fim de mes: segue LocalDate.plusMonths, como antes nas quatro copias.
        assertThat(vacinacao(LocalDate.of(2026, 1, 31), 1).calcularDataValidade()).isEqualTo(LocalDate.of(2026, 2, 28));
    }

    @Test
    void semIntervaloSemVacinaOuSemAplicacaoNaoTemValidade() {
        assertThat(vacinacao(LocalDate.of(2026, 3, 10), null).calcularDataValidade()).isNull();
        assertThat(vacinacao(null, 12).calcularDataValidade()).isNull();
        Vacinacao semVacina = new Vacinacao();
        semVacina.setDataAplicacao(LocalDate.of(2026, 3, 10));
        assertThat(semVacina.calcularDataValidade()).isNull();
    }
}
