package com.siszoo.animais.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class EutanasiaSemResponsavelTecnicoException extends ErroNegocioException {

    public EutanasiaSemResponsavelTecnicoException() {
        super(HttpStatus.FORBIDDEN,
                "Só veterinário com CRMV cadastrado pode registrar o laudo de eutanásia.");
    }
}
