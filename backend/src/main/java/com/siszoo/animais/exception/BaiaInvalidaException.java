package com.siszoo.animais.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class BaiaInvalidaException extends ErroNegocioException {

    public BaiaInvalidaException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Baia informada nao existe");
    }
}
