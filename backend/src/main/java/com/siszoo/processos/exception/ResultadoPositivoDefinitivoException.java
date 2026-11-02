package com.siszoo.processos.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

// Resultado positivo e definitivo, nao pode ser corrigido (422).
public class ResultadoPositivoDefinitivoException extends ErroNegocioException {

    public ResultadoPositivoDefinitivoException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Resultado positivo é definitivo e não pode ser corrigido.");
    }
}
