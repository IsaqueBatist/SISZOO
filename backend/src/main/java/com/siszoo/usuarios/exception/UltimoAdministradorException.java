package com.siszoo.usuarios.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class UltimoAdministradorException extends ErroNegocioException {

    public UltimoAdministradorException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT,
                "O sistema precisa de pelo menos um Administrador ativo. Defina outro Administrador antes de continuar.");
    }
}
