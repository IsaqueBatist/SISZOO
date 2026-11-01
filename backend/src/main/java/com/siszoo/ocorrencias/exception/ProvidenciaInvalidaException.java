package com.siszoo.ocorrencias.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class ProvidenciaInvalidaException extends ErroNegocioException {

    public ProvidenciaInvalidaException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "A providência informada não existe. Selecione uma da lista.");
    }
}
