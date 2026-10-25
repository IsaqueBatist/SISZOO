package com.siszoo.usuarios.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class UsuarioNaoPodeDesativarASiMesmoException extends ErroNegocioException {

    public UsuarioNaoPodeDesativarASiMesmoException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Nao e permitido desativar o proprio usuario");
    }
}
