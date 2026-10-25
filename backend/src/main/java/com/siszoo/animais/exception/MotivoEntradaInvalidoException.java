package com.siszoo.animais.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class MotivoEntradaInvalidoException extends ErroNegocioException {

    public MotivoEntradaInvalidoException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Motivo de entrada informado nao existe");
    }
}
