package com.siszoo.animais.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class MicrochipImutavelException extends ErroNegocioException {

    public MicrochipImutavelException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Microchip nao pode ser alterado apos definido");
    }
}
