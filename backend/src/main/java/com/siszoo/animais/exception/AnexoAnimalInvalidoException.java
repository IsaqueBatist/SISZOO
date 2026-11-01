package com.siszoo.animais.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

// F2-007 / RF-A04 (anexos do animal).
public class AnexoAnimalInvalidoException extends ErroNegocioException {

    public AnexoAnimalInvalidoException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Envie um arquivo JPG, PNG ou PDF com até 5 MB.");
    }
}
