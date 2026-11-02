package com.siszoo.processos.service;

import java.util.Set;

final class ResultadosNotificaveis {

    static final Set<String> CODIGOS = Set.of("positivo", "inconclusivo");

    private ResultadosNotificaveis() {
    }

    static boolean notifica(String codigoResultado) {
        return codigoResultado != null && CODIGOS.contains(codigoResultado);
    }
}
