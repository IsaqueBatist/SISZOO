package com.siszoo.processos.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class IdentificacaoObrigatoriaException extends ErroNegocioException {

    public IdentificacaoObrigatoriaException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Informe a espécie e o sexo do animal de campo.");
    }
}
