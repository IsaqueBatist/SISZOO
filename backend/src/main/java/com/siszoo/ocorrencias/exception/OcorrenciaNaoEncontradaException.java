package com.siszoo.ocorrencias.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class OcorrenciaNaoEncontradaException extends ErroNegocioException {

    public OcorrenciaNaoEncontradaException() {
        super(HttpStatus.NOT_FOUND, "Ocorrencia nao encontrada");
    }
}
