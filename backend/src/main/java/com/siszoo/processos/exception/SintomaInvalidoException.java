package com.siszoo.processos.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class SintomaInvalidoException extends ErroNegocioException {

    public SintomaInvalidoException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Um dos sintomas informados não está disponível. Selecione os sintomas da lista.");
    }
}
