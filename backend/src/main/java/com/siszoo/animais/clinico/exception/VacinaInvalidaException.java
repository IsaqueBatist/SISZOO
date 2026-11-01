package com.siszoo.animais.clinico.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class VacinaInvalidaException extends ErroNegocioException {

    public VacinaInvalidaException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "A vacina informada não existe. Selecione uma da lista.");
    }
}
