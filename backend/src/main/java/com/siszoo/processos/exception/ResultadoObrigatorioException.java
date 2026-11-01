package com.siszoo.processos.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class ResultadoObrigatorioException extends ErroNegocioException {

    public ResultadoObrigatorioException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Registre o resultado laboratorial para avançar o processo.");
    }
}
