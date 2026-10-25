package com.siszoo.animais.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

// F2-007 / RF-A04 (anexos do animal).
public class AnexoAnimalNaoEncontradoException extends ErroNegocioException {

    public AnexoAnimalNaoEncontradoException() {
        super(HttpStatus.NOT_FOUND, "Anexo nao encontrado");
    }
}
