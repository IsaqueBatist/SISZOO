package com.siszoo.usuarios.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class CabecalhoSessaoAusenteException extends ErroNegocioException {

    public CabecalhoSessaoAusenteException() {
        super(HttpStatus.FORBIDDEN, "Não foi possível validar a sua sessão. Recarregue a página e tente novamente.");
    }
}
