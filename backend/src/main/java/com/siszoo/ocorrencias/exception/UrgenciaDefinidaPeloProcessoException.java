package com.siszoo.ocorrencias.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class UrgenciaDefinidaPeloProcessoException extends ErroNegocioException {

    public UrgenciaDefinidaPeloProcessoException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "A urgência foi definida pelo processo vinculado e não pode ser desmarcada.");
    }
}
