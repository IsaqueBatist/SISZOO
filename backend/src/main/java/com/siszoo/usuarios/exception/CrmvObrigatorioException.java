package com.siszoo.usuarios.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class CrmvObrigatorioException extends ErroNegocioException {

    public CrmvObrigatorioException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "CRMV e obrigatorio para o cargo Veterinario");
    }
}
