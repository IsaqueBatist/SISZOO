package com.siszoo.processos.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class IdentificacaoComAnimalDoCanilException extends ErroNegocioException {

    public IdentificacaoComAnimalDoCanilException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Amostra de animal do canil nao aceita dados de identificacao: eles vem da ficha");
    }
}
