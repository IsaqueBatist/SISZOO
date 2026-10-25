package com.siszoo.ocorrencias.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class AnonimatoIrreversivelException extends ErroNegocioException {

    public AnonimatoIrreversivelException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Denuncia identificada nao pode passar a anonima");
    }
}
