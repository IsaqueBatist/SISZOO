package com.siszoo.processos.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class DesfechoInvalidoException extends ErroNegocioException {

    public DesfechoInvalidoException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Desfecho do animal informado nao existe");
    }
}
