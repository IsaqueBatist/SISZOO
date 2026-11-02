package com.siszoo.animais.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class LaudoEutanasiaImutavelException extends ErroNegocioException {

    public LaudoEutanasiaImutavelException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "O laudo de eutanásia já registrado não pode ser alterado.");
    }
}
