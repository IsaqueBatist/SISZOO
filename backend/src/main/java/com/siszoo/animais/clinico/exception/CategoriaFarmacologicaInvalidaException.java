package com.siszoo.animais.clinico.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class CategoriaFarmacologicaInvalidaException extends ErroNegocioException {

    public CategoriaFarmacologicaInvalidaException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "A categoria farmacológica informada não existe. Selecione uma da lista.");
    }
}
