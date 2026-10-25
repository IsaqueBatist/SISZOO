package com.siszoo.animais.clinico.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class ProcedimentoNaoEncontradoException extends ErroNegocioException {

    public ProcedimentoNaoEncontradoException() {
        super(HttpStatus.NOT_FOUND, "Procedimento nao encontrado");
    }
}
