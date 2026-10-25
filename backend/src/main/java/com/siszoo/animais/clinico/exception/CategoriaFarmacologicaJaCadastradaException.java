package com.siszoo.animais.clinico.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class CategoriaFarmacologicaJaCadastradaException extends ErroNegocioException {

    public CategoriaFarmacologicaJaCadastradaException() {
        super(HttpStatus.CONFLICT, "Categoria farmacologica ja cadastrada");
    }
}
