package com.siszoo.processos.service;

import java.util.Set;

/**
 * Resultados laboratoriais que disparam a notificacao por e-mail ao municipe
 * (RN10 do TG): Positivo e Inconclusivo.
 * Criterio unico para o lancamento ({@link ProcessoSanitarioService}), o
 * reenvio ({@link NotificacaoResultadoService}) e o front
 * (CardResultadoProcesso.tsx, RESULTADOS_QUE_NOTIFICAM). Nao confundir com o
 * resultado definitivo (so o positivo nao se corrige, V21).
 */
final class ResultadosNotificaveis {

    static final Set<String> CODIGOS = Set.of("positivo", "inconclusivo");

    private ResultadosNotificaveis() {
    }

    static boolean notifica(String codigoResultado) {
        return codigoResultado != null && CODIGOS.contains(codigoResultado);
    }
}
