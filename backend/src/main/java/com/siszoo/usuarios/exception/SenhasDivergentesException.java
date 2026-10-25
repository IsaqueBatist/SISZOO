package com.siszoo.usuarios.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class SenhasDivergentesException extends ErroNegocioException {

    public SenhasDivergentesException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Nova senha e confirmacao nao conferem");
    }
}
