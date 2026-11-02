package com.siszoo.processos.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class NotificacaoJaConfirmadaException extends ErroNegocioException {

    public NotificacaoJaConfirmadaException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "O munícipe já foi notificado. Não é preciso reenviar.");
    }
}
