package com.siszoo.ocorrencias.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class AnexoNaoEncontradoException extends ErroNegocioException {

    public AnexoNaoEncontradoException() {
        super(HttpStatus.NOT_FOUND, "Anexo nao encontrado");
    }
}
