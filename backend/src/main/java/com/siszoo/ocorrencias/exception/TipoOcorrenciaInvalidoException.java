package com.siszoo.ocorrencias.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class TipoOcorrenciaInvalidoException extends ErroNegocioException {

    public TipoOcorrenciaInvalidoException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "O tipo de ocorrência informado não existe. Selecione um da lista.");
    }
}
