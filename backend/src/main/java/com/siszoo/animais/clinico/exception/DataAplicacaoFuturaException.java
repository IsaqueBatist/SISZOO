package com.siszoo.animais.clinico.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class DataAplicacaoFuturaException extends ErroNegocioException {

    public DataAplicacaoFuturaException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Data de aplicacao nao pode ser futura");
    }
}
