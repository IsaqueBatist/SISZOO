package com.siszoo.animais.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class BaiaIndisponivelException extends ErroNegocioException {

    private BaiaIndisponivelException(String mensagem) {
        super(HttpStatus.CONFLICT, mensagem);
    }

    public static BaiaIndisponivelException inativa() {
        return new BaiaIndisponivelException("Baia informada esta inativa");
    }

    public static BaiaIndisponivelException superlotada() {
        return new BaiaIndisponivelException("Baia informada ja atingiu a capacidade");
    }
}
