package com.siszoo.processos.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class CorrecaoResultadoNaoPermitidaException extends ErroNegocioException {

    public CorrecaoResultadoNaoPermitidaException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Resultado so pode ser corrigido com o processo em COM_RESULTADO");
    }
}
