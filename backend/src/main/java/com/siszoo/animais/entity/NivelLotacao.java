package com.siszoo.animais.entity;

import java.util.Locale;

public enum NivelLotacao {
    NORMAL("Normal"),
    PROXIMO_LIMITE("Próximo do limite"),
    SUPERLOTADA("Superlotada");

    private static final int PERCENTUAL_PROXIMO_LIMITE = 80;

    private final String rotulo;

    NivelLotacao(String rotulo) {
        this.rotulo = rotulo;
    }

    public static NivelLotacao de(long ocupacao, int capacidade) {
        if (ocupacao == 0) {
            return NORMAL;
        }
        if (ocupacao >= capacidade) {
            return SUPERLOTADA;
        }
        return ocupacao * 100 >= (long) capacidade * PERCENTUAL_PROXIMO_LIMITE ? PROXIMO_LIMITE : NORMAL;
    }

    public String codigo() {
        return name().toLowerCase(Locale.ROOT);
    }

    public String rotulo() {
        return rotulo;
    }
}
