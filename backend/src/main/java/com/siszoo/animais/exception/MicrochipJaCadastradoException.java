package com.siszoo.animais.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class MicrochipJaCadastradoException extends ErroNegocioException {

    public MicrochipJaCadastradoException() {
        super(HttpStatus.CONFLICT, "Microchip ja cadastrado");
    }
}
