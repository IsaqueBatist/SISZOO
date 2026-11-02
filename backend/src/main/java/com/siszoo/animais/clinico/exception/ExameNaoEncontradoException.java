package com.siszoo.animais.clinico.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class ExameNaoEncontradoException extends ErroNegocioException {

    public ExameNaoEncontradoException() {
        super(HttpStatus.NOT_FOUND, "Exame não encontrado.");
    }
}
