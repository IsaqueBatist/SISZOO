package com.siszoo.processos.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class DoencaInvalidaException extends ErroNegocioException {

    public DoencaInvalidaException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Doenca invalida");
    }
}
