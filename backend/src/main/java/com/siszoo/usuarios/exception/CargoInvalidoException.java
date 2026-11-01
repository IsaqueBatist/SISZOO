package com.siszoo.usuarios.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class CargoInvalidoException extends ErroNegocioException {

    public CargoInvalidoException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "O perfil informado não existe. Selecione um perfil da lista.");
    }
}
