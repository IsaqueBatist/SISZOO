package com.siszoo.animais.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class TransferenciaImutavelException extends ErroNegocioException {

    public TransferenciaImutavelException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "A transferência já registrada não pode ser alterada.");
    }
}
