package com.siszoo.processos.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class ContatoHumanoInconsistenteException extends ErroNegocioException {

    public ContatoHumanoInconsistenteException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Nivel de contato e agressao sao obrigatorios com contato humano e proibidos sem ele");
    }
}
