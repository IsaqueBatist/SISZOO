package com.siszoo.animais.clinico.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class MedicamentoInvalidoException extends ErroNegocioException {

    public MedicamentoInvalidoException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Medicamento informado nao existe");
    }
}
