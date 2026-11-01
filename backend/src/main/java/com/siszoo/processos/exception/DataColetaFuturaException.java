package com.siszoo.processos.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class DataColetaFuturaException extends ErroNegocioException {

    public DataColetaFuturaException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "A data de coleta não pode ser futura.");
    }
}
