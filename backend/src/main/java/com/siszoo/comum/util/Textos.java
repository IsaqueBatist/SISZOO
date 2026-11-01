package com.siszoo.comum.util;

public final class Textos {

    private Textos() {
    }

    // Texto livre opcional: sem espacos nas pontas; vazio vira null.
    public static String normalizar(String valor) {
        if (valor == null) {
            return null;
        }
        String limpo = valor.trim();
        return limpo.isEmpty() ? null : limpo;
    }
}
