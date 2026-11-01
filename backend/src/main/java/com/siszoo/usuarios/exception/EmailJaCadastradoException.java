package com.siszoo.usuarios.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class EmailJaCadastradoException extends ErroNegocioException {

    public EmailJaCadastradoException() {
        super(HttpStatus.CONFLICT, "Este e-mail já está cadastrado.");
    }
}
