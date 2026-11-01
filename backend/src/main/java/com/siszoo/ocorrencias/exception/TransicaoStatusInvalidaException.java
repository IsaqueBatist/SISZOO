package com.siszoo.ocorrencias.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class TransicaoStatusInvalidaException extends ErroNegocioException {

    public TransicaoStatusInvalidaException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Esta mudança de status não é permitida para a ocorrência.");
    }
}
