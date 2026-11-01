package com.siszoo.ocorrencias.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class LimiteAnexosAtingidoException extends ErroNegocioException {

    public LimiteAnexosAtingidoException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Esta ocorrência atingiu o limite de 5 anexos.");
    }
}
