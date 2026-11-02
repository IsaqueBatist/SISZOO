package com.siszoo.usuarios.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class SessaoExpiradaException extends ErroNegocioException {

    public SessaoExpiradaException() {
        super(HttpStatus.UNAUTHORIZED, "Sua sessão expirou. Entre novamente para continuar.");
    }
}
