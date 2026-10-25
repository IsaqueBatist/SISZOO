package com.siszoo.processos.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class ResultadoJaRegistradoException extends ErroNegocioException {

    public ResultadoJaRegistradoException() {
        super(HttpStatus.CONFLICT, "Processo ja tem resultado registrado; para corrigir, informe retificaId do resultado vigente");
    }
}
