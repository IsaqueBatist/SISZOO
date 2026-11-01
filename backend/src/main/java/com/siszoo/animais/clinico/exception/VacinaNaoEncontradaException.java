package com.siszoo.animais.clinico.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class VacinaNaoEncontradaException extends ErroNegocioException {

    public VacinaNaoEncontradaException() {
        super(HttpStatus.NOT_FOUND, "Vacina nao encontrada");
    }
}
