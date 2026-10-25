package com.siszoo.ocorrencias.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class NomeDenuncianteObrigatorioException extends ErroNegocioException {

    public NomeDenuncianteObrigatorioException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Nome do denunciante e obrigatorio quando a denuncia nao e anonima nem sigilosa");
    }
}
