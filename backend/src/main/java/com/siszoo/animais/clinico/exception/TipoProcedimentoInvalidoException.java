package com.siszoo.animais.clinico.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class TipoProcedimentoInvalidoException extends ErroNegocioException {

    public TipoProcedimentoInvalidoException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "O tipo de procedimento informado não existe. Selecione um da lista.");
    }
}
