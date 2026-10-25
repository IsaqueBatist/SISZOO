package com.siszoo.processos.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class SintomaSemStatusSintomaticoException extends ErroNegocioException {

    public SintomaSemStatusSintomaticoException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Sintomas so podem ser informados em amostra com status clinico sintomatico");
    }
}
