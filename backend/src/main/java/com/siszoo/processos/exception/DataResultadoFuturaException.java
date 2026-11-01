package com.siszoo.processos.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class DataResultadoFuturaException extends ErroNegocioException {

    public DataResultadoFuturaException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "A data do resultado não pode ser futura.");
    }
}
