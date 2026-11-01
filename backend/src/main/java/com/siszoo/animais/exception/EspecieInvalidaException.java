package com.siszoo.animais.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class EspecieInvalidaException extends ErroNegocioException {

    public EspecieInvalidaException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "A espécie informada não existe. Selecione uma da lista.");
    }
}
