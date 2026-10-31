package com.siszoo.animais.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

// F2-007 / RF-A04 (anexos do animal).
public class LimiteAnexosAnimalAtingidoException extends ErroNegocioException {

    public LimiteAnexosAnimalAtingidoException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Este animal atingiu o limite de 10 anexos.");
    }
}
