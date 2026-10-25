package com.siszoo.animais.clinico.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class RetificacaoAnimalDivergenteException extends ErroNegocioException {

    public RetificacaoAnimalDivergenteException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Registro retificado pertence a outro animal");
    }
}
