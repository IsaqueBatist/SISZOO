package com.siszoo.processos.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class ProcessoNaoEncontradoException extends ErroNegocioException {

    public ProcessoNaoEncontradoException() {
        super(HttpStatus.NOT_FOUND, "Processo sanitario nao encontrado");
    }
}
