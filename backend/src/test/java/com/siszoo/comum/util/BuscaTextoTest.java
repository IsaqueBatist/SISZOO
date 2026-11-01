package com.siszoo.comum.util;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class BuscaTextoTest {

    @Test
    void padraoIgnoraAcentoMaiusculaEEspacosNasPontas() {
        assertThat(BuscaTexto.padrao("  São JOÃO ")).isEqualTo("%sao joao%");
        assertThat(BuscaTexto.padrao("Ação")).isEqualTo("%acao%");
    }

    @Test
    void curingasDigitadosViramCaracteresComuns() {
        assertThat(BuscaTexto.padrao("100%")).isEqualTo("%100\\%%");
        assertThat(BuscaTexto.padrao("a_b")).isEqualTo("%a\\_b%");
        assertThat(BuscaTexto.padrao("c\\d")).isEqualTo("%c\\\\d%");
    }
}
