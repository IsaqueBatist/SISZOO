package com.siszoo.animais.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class TipoBaiaInvalidoException extends ErroNegocioException {

    public TipoBaiaInvalidoException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "O tipo de baia informado não existe. Selecione um da lista.");
    }
}
