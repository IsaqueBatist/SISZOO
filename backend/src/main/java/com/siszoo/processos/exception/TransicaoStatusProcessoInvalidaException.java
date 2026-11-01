package com.siszoo.processos.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class TransicaoStatusProcessoInvalidaException extends ErroNegocioException {

    public TransicaoStatusProcessoInvalidaException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Esta mudança de status não é permitida para o processo.");
    }
}
