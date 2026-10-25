package com.siszoo.comum.validacao;

import java.nio.charset.StandardCharsets;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class TamanhoMaximoBytesValidator implements ConstraintValidator<TamanhoMaximoBytes, String> {

    private int maximo;

    @Override
    public void initialize(TamanhoMaximoBytes anotacao) {
        maximo = anotacao.value();
    }

    @Override
    public boolean isValid(String valor, ConstraintValidatorContext contexto) {
        return valor == null || valor.getBytes(StandardCharsets.UTF_8).length <= maximo;
    }
}
