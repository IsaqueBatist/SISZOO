package com.siszoo.processos.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class ReenvioNotificacaoNaoPermitidoException extends ErroNegocioException {

    public ReenvioNotificacaoNaoPermitidoException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Só há notificação para reenviar quando o resultado vigente é positivo ou inconclusivo.");
    }
}
