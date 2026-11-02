package com.siszoo.animais.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class AnexoAnimalNaoEncontradoException extends ErroNegocioException {

    public AnexoAnimalNaoEncontradoException() {
        super(HttpStatus.NOT_FOUND, "Anexo não encontrado.");
    }
}
