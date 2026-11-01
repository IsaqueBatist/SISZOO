package com.siszoo.usuarios.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class CrmvObrigatorioException extends ErroNegocioException {

    public CrmvObrigatorioException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Informe o CRMV para o perfil Veterinário.");
    }
}
