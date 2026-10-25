package com.siszoo.animais.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class BaiaNaoEncontradaException extends ErroNegocioException {

    public BaiaNaoEncontradaException() {
        super(HttpStatus.NOT_FOUND, "Baia nao encontrada");
    }
}
