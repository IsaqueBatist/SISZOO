package com.siszoo.processos.service;

import java.util.Set;

/**
 * Resultados laboratoriais que disparam a notificacao por e-mail ao municipe
 * (RN10 do TG, revisao de 22/10/2026 — F2-014): Positivo e Inconclusivo.
 * Criterio unico para o lancamento ({@link ProcessoSanitarioService}), o
 * reenvio ({@link NotificacaoResultadoService}) e o front
 * (CardResultadoProcesso.tsx, RESULTADOS_QUE_NOTIFICAM). Nao confundir com o
 * resultado definitivo (so o positivo nao se corrige, T35-15/V21).
 */
final class ResultadosNotificaveis {

    static final Set<String> CODIGOS = Set.of("positivo", "inconclusivo");

    private ResultadosNotificaveis() {
    }

    static boolean notifica(String codigoResultado) {
        return codigoResultado != null && CODIGOS.contains(codigoResultado);
    }
}
