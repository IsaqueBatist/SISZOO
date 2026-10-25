package com.siszoo.animais.clinico.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

// F2-007 / RF-A04 (exames).
public class ExameNaoEncontradoException extends ErroNegocioException {

    public ExameNaoEncontradoException() {
        super(HttpStatus.NOT_FOUND, "Exame nao encontrado");
    }
}
