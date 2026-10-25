package com.siszoo.processos.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class ResultadoObrigatorioException extends ErroNegocioException {

    public ResultadoObrigatorioException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "O status COM_RESULTADO so e alcancado pelo registro do resultado laboratorial");
    }
}
