package com.siszoo.ocorrencias.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class AnimalJaVinculadoException extends ErroNegocioException {

    public AnimalJaVinculadoException(String protocolo) {
        super(HttpStatus.CONFLICT, "Este animal já está vinculado à ocorrência " + protocolo + ".");
    }
}
