package com.siszoo.animais.clinico.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class RegistroJaRetificadoException extends ErroNegocioException {

    public RegistroJaRetificadoException() {
        super(HttpStatus.CONFLICT, "Registro ja foi retificado por outro");
    }
}
