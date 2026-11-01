package com.siszoo.processos.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class CorrecaoResultadoNaoPermitidaException extends ErroNegocioException {

    public CorrecaoResultadoNaoPermitidaException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "O resultado só pode ser corrigido enquanto o processo tiver resultado lançado e não estiver concluído.");
    }
}
