package com.siszoo.comum.exception;

import org.springframework.http.HttpStatus;

public abstract class ErroNegocioException extends RuntimeException {

    private final HttpStatus status;

    protected ErroNegocioException(HttpStatus status, String mensagemParaOCliente) {
        super(mensagemParaOCliente);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
