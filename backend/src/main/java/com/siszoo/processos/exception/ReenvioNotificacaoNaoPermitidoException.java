package com.siszoo.processos.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

// So ha notificacao ao municipe para reenviar quando o resultado
// vigente do processo e positivo ou inconclusivo (RN10) - sem isso, nada a reenviar (422).
public class ReenvioNotificacaoNaoPermitidoException extends ErroNegocioException {

    public ReenvioNotificacaoNaoPermitidoException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Só há notificação para reenviar quando o resultado vigente é positivo ou inconclusivo.");
    }
}
