package com.siszoo.animais.entity;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

class NivelLotacaoTest {

    @ParameterizedTest
    @CsvSource({
            "0, 6, NORMAL",
            "3, 6, NORMAL",
            "79, 100, NORMAL",
            "199, 250, NORMAL",
            "80, 100, PROXIMO_LIMITE",
            "5, 6, PROXIMO_LIMITE",
            "99, 100, PROXIMO_LIMITE",
            "249, 250, PROXIMO_LIMITE",
            "6, 6, SUPERLOTADA",
            "8, 6, SUPERLOTADA",
            "0, 0, NORMAL",
            "3, 0, SUPERLOTADA",
    })
    void classificaPelaRegraUnica(long ocupacao, int capacidade, NivelLotacao esperado) {
        assertThat(NivelLotacao.de(ocupacao, capacidade)).isEqualTo(esperado);
    }

    @ParameterizedTest
    @CsvSource({
            "NORMAL, normal, Normal",
            "PROXIMO_LIMITE, proximo_limite, Próximo do limite",
            "SUPERLOTADA, superlotada, Superlotada",
    })
    void codigoERotulo(NivelLotacao nivel, String codigo, String rotulo) {
        assertThat(nivel.codigo()).isEqualTo(codigo);
        assertThat(nivel.rotulo()).isEqualTo(rotulo);
    }
}
