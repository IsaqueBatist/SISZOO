package com.siszoo.animais.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class AnimalNaoEncontradoException extends ErroNegocioException {

    public AnimalNaoEncontradoException() {
        super(HttpStatus.NOT_FOUND, "Animal nao encontrado");
    }
}
