package com.siszoo.processos.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class ConclusaoSemResultadoException extends ErroNegocioException {

    public ConclusaoSemResultadoException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Processo so pode ser concluido com resultado laboratorial registrado");
    }
}
