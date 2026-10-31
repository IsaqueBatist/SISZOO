package com.siszoo.processos.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class IdentificacaoComAnimalDoCanilException extends ErroNegocioException {

    public IdentificacaoComAnimalDoCanilException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "A identificação do animal do canil vem da ficha dele e não pode ser enviada na amostra.");
    }
}
