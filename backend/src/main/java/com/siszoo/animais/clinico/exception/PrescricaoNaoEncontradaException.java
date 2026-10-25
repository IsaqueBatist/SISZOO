package com.siszoo.animais.clinico.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class PrescricaoNaoEncontradaException extends ErroNegocioException {

    public PrescricaoNaoEncontradaException() {
        super(HttpStatus.NOT_FOUND, "Prescricao nao encontrada");
    }
}
