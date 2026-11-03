package com.siszoo.ocorrencias.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class AnimalDaOcorrenciaEncerradaException extends ErroNegocioException {

    public AnimalDaOcorrenciaEncerradaException() {
        super(HttpStatus.CONFLICT,
                "A ocorrência encerrada já tem animal vinculado; o vínculo não pode ser trocado.");
    }
}
