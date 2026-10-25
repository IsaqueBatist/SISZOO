package com.siszoo.usuarios.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class CargoInvalidoException extends ErroNegocioException {

    public CargoInvalidoException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Cargo informado nao existe");
    }
}
