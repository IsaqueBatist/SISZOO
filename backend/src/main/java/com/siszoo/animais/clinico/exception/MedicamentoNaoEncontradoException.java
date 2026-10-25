package com.siszoo.animais.clinico.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class MedicamentoNaoEncontradoException extends ErroNegocioException {

    public MedicamentoNaoEncontradoException() {
        super(HttpStatus.NOT_FOUND, "Medicamento nao encontrado");
    }
}
