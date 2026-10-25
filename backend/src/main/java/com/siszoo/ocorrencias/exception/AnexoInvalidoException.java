package com.siszoo.ocorrencias.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class AnexoInvalidoException extends ErroNegocioException {

    public AnexoInvalidoException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Anexo deve ser JPG, PNG ou PDF com ate 5 MB");
    }
}
