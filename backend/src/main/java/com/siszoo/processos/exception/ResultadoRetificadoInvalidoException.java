package com.siszoo.processos.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class ResultadoRetificadoInvalidoException extends ErroNegocioException {

    public ResultadoRetificadoInvalidoException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Resultado a corrigir nao existe neste processo");
    }
}
