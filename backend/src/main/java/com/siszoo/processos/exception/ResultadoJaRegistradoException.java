package com.siszoo.processos.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class ResultadoJaRegistradoException extends ErroNegocioException {

    public ResultadoJaRegistradoException() {
        super(HttpStatus.CONFLICT, "Este processo já tem resultado registrado. Para mudar, use a correção do resultado.");
    }
}
