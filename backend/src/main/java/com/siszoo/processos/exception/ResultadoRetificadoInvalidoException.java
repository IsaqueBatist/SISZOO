package com.siszoo.processos.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class ResultadoRetificadoInvalidoException extends ErroNegocioException {

    public ResultadoRetificadoInvalidoException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "O resultado a corrigir não pertence a este processo.");
    }
}
