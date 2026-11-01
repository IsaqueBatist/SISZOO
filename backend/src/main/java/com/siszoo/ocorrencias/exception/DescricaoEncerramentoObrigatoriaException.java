package com.siszoo.ocorrencias.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class DescricaoEncerramentoObrigatoriaException extends ErroNegocioException {

    public DescricaoEncerramentoObrigatoriaException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Descreva o encerramento quando a providência for \"Outro\".");
    }
}
