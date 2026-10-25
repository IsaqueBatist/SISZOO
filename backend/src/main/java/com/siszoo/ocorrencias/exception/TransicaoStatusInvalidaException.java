package com.siszoo.ocorrencias.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class TransicaoStatusInvalidaException extends ErroNegocioException {

    public TransicaoStatusInvalidaException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Transicao de status nao permitida para a ocorrencia");
    }
}
