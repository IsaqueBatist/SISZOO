package com.siszoo.animais.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class MotivoEntradaInvalidoException extends ErroNegocioException {

    public MotivoEntradaInvalidoException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "O motivo de entrada informado não existe. Selecione um da lista.");
    }
}
