package com.siszoo.ocorrencias.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class AnonimaESigilosaException extends ErroNegocioException {

    public AnonimaESigilosaException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "A denúncia não pode ser anônima e sigilosa ao mesmo tempo. Escolha uma das opções.");
    }
}
