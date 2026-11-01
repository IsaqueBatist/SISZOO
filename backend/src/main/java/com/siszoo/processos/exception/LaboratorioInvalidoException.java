package com.siszoo.processos.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class LaboratorioInvalidoException extends ErroNegocioException {

    public LaboratorioInvalidoException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "O laboratório informado não está disponível. Selecione outro da lista.");
    }
}
