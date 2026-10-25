package com.siszoo.processos.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class ResultadoInvalidoException extends ErroNegocioException {

    public ResultadoInvalidoException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Resultado laboratorial invalido: use positivo, negativo, inconclusivo, material_inadequado ou nao_realizado");
    }
}
