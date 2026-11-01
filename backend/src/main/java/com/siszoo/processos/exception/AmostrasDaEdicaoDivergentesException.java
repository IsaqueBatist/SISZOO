package com.siszoo.processos.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class AmostrasDaEdicaoDivergentesException extends ErroNegocioException {

    public AmostrasDaEdicaoDivergentesException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT,
                "A edição corrige as amostras do processo, mas não inclui, remove nem troca o animal de uma amostra.");
    }
}
