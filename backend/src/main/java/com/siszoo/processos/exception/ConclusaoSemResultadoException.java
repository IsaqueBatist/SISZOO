package com.siszoo.processos.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class ConclusaoSemResultadoException extends ErroNegocioException {

    public ConclusaoSemResultadoException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Registre o resultado laboratorial antes de concluir o processo.");
    }
}
