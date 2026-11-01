package com.siszoo.ocorrencias.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class VinculoJaExistenteException extends ErroNegocioException {

    public VinculoJaExistenteException() {
        super(HttpStatus.CONFLICT, "A ocorrência ou o processo já tem vínculo.");
    }
}
