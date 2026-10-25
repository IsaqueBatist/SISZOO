package com.siszoo.ocorrencias.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class EncerramentoComProcessoPendenteException extends ErroNegocioException {

    public EncerramentoComProcessoPendenteException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Ocorrencia com processo sanitario vinculado nao concluido nao pode ser encerrada");
    }
}
