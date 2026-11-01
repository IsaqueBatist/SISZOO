package com.siszoo.usuarios.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class UsuarioNaoPodeRedefinirPropriaSenhaException extends ErroNegocioException {

    public UsuarioNaoPodeRedefinirPropriaSenhaException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT,
                "A redefinição é para a senha de outra pessoa. Para mudar a sua, use a troca de senha.");
    }
}
