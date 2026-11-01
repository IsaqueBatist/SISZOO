package com.siszoo.ocorrencias.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class DataAberturaFuturaException extends ErroNegocioException {

    public DataAberturaFuturaException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "A data de abertura não pode ser futura.");
    }
}
