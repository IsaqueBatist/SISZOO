package com.siszoo.processos.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

// T35: so ha notificacao ao municipe para reenviar quando o resultado
// vigente do processo e positivo (regra 19, DER) — sem isso, nada a reenviar (422).
public class ReenvioNotificacaoNaoPermitidoException extends ErroNegocioException {

    public ReenvioNotificacaoNaoPermitidoException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "So ha notificacao ao municipe para reenviar com resultado positivo vigente");
    }
}
