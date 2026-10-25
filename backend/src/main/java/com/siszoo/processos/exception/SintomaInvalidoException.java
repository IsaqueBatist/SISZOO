package com.siszoo.processos.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class SintomaInvalidoException extends ErroNegocioException {

    public SintomaInvalidoException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Sintoma invalido");
    }
}
