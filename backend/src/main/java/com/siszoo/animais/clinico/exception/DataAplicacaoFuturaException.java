package com.siszoo.animais.clinico.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class DataAplicacaoFuturaException extends ErroNegocioException {

    public DataAplicacaoFuturaException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "A data de aplicação não pode ser futura.");
    }
}
