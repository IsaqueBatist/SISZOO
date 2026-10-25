package com.siszoo.animais.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class StatusAnimalInvalidoException extends ErroNegocioException {

    public StatusAnimalInvalidoException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Status informado nao existe");
    }
}
