package com.siszoo.processos.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class DoencaComResultadoLancadoException extends ErroNegocioException {

    public DoencaComResultadoLancadoException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT,
                "A doença não pode mudar depois de lançado o resultado, porque o resultado foi dado para ela.");
    }
}
