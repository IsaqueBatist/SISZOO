package com.siszoo.ocorrencias.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class ProvidenciaObrigatoriaException extends ErroNegocioException {

    public ProvidenciaObrigatoriaException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Providencia tomada e obrigatoria no encerramento");
    }
}
