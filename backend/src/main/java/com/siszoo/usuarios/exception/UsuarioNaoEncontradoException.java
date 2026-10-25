package com.siszoo.usuarios.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class UsuarioNaoEncontradoException extends ErroNegocioException {

    public UsuarioNaoEncontradoException() {
        super(HttpStatus.NOT_FOUND, "Usuario nao encontrado");
    }
}
