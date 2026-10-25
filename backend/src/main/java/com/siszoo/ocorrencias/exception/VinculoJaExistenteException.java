package com.siszoo.ocorrencias.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class VinculoJaExistenteException extends ErroNegocioException {

    public VinculoJaExistenteException() {
        super(HttpStatus.CONFLICT, "Ocorrencia ou processo ja possui vinculo");
    }
}
