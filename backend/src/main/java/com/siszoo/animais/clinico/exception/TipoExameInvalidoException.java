package com.siszoo.animais.clinico.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

// F2-007 / RF-A04 (exames).
public class TipoExameInvalidoException extends ErroNegocioException {

    public TipoExameInvalidoException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Tipo de exame informado nao existe");
    }
}
