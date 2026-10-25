package com.siszoo.ocorrencias.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class AnonimaESigilosaException extends ErroNegocioException {

    public AnonimaESigilosaException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Denuncia nao pode ser anonima e sigilosa ao mesmo tempo");
    }
}
