package com.siszoo.animais.clinico.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class TipoProcedimentoInvalidoException extends ErroNegocioException {

    public TipoProcedimentoInvalidoException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Tipo de procedimento informado nao existe");
    }
}
