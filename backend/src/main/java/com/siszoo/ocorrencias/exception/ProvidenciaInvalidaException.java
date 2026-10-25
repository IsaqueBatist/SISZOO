package com.siszoo.ocorrencias.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class ProvidenciaInvalidaException extends ErroNegocioException {

    public ProvidenciaInvalidaException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Providencia informada nao existe");
    }
}
