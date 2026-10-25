package com.siszoo.ocorrencias.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class OcorrenciaEncerradaException extends ErroNegocioException {

    public OcorrenciaEncerradaException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Ocorrencia encerrada nao pode ser alterada");
    }
}
