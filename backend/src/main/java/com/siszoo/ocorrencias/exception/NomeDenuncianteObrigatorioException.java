package com.siszoo.ocorrencias.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class NomeDenuncianteObrigatorioException extends ErroNegocioException {

    public NomeDenuncianteObrigatorioException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Informe o nome do denunciante quando a denúncia não for anônima nem sigilosa.");
    }
}
