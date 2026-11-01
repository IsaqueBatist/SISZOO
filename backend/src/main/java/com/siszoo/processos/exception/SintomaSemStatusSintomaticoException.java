package com.siszoo.processos.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class SintomaSemStatusSintomaticoException extends ErroNegocioException {

    public SintomaSemStatusSintomaticoException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Informe sintomas apenas em amostra com status clínico sintomático.");
    }
}
