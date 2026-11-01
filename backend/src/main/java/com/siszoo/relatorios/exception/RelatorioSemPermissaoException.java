package com.siszoo.relatorios.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class RelatorioSemPermissaoException extends ErroNegocioException {

    public RelatorioSemPermissaoException() {
        super(HttpStatus.FORBIDDEN, "Você não tem permissão para acessar este relatório.");
    }
}
