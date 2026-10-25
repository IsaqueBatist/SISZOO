package com.siszoo.animais.clinico.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class VacinacaoNaoEncontradaException extends ErroNegocioException {

    public VacinacaoNaoEncontradaException() {
        super(HttpStatus.NOT_FOUND, "Vacinacao nao encontrada");
    }
}
