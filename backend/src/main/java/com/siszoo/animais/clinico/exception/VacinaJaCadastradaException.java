package com.siszoo.animais.clinico.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class VacinaJaCadastradaException extends ErroNegocioException {

    public VacinaJaCadastradaException(String nomeExistente, String codigo, boolean existenteInativa) {
        super(HttpStatus.CONFLICT, montarMensagem(nomeExistente, codigo, existenteInativa));
    }

    private static String montarMensagem(String nomeExistente, String codigo, boolean existenteInativa) {
        if (existenteInativa) {
            return "A vacina \"%s\" já existe com o mesmo código (%s), mas está desativada. Reative-a em Vacinas."
                    .formatted(nomeExistente, codigo);
        }
        return "Já existe a vacina \"%s\" com o mesmo código (%s). Use um nome que as diferencie."
                .formatted(nomeExistente, codigo);
    }
}
