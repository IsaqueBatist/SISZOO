package com.siszoo.ocorrencias.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class LimiteAnexosAtingidoException extends ErroNegocioException {

    public LimiteAnexosAtingidoException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Limite de 5 anexos por ocorrencia atingido");
    }
}
