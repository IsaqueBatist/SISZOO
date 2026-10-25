package com.siszoo.processos.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class TransicaoStatusProcessoInvalidaException extends ErroNegocioException {

    public TransicaoStatusProcessoInvalidaException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Transicao de status nao permitida para o processo");
    }
}
