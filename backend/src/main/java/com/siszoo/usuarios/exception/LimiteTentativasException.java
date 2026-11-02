package com.siszoo.usuarios.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class LimiteTentativasException extends ErroNegocioException {

    public LimiteTentativasException() {
        super(HttpStatus.TOO_MANY_REQUESTS, "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.");
    }
}
