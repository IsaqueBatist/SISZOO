package com.siszoo.usuarios.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class CredencialInvalidaException extends ErroNegocioException {

    public CredencialInvalidaException() {
        super(HttpStatus.UNAUTHORIZED, "Credenciais invalidas");
    }
}
