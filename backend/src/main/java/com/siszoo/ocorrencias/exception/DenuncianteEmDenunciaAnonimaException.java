package com.siszoo.ocorrencias.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class DenuncianteEmDenunciaAnonimaException extends ErroNegocioException {

    public DenuncianteEmDenunciaAnonimaException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Denúncia anônima não aceita dados do denunciante.");
    }
}
