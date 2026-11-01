package com.siszoo.usuarios.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class UsuarioNaoPodeAlterarProprioCargoException extends ErroNegocioException {

    public UsuarioNaoPodeAlterarProprioCargoException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT,
                "Você não pode alterar o seu próprio perfil de acesso. Peça a outro Administrador.");
    }
}
