package com.siszoo.animais.clinico.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

// 409 do CADASTRO de catalogo. Nao confundir com VacinaInvalidaException, que
// e 422 e pertence ao contrato de POST /api/vacinacoes ("vacina informada nao
// existe ou esta inativa").
//
// A mensagem nomeia a vacina em conflito porque o usuario nunca ve o `codigo`
// na tela: sem isso, "V4 (felinos)" e "V4 felinos" dariam 409 sem explicacao,
// ja que os dois nomes derivam o mesmo codigo.
public class VacinaJaCadastradaException extends ErroNegocioException {

    public VacinaJaCadastradaException(String nomeExistente, String codigo, boolean existenteInativa) {
        super(HttpStatus.CONFLICT, montarMensagem(nomeExistente, codigo, existenteInativa));
    }

    private static String montarMensagem(String nomeExistente, String codigo, boolean existenteInativa) {
        if (existenteInativa) {
            return "A vacina \"%s\" ja existe com o mesmo codigo (%s), mas esta desativada. Reative-a em Vacinas."
                    .formatted(nomeExistente, codigo);
        }
        return "Ja existe a vacina \"%s\" com o mesmo codigo (%s). Use um nome que as diferencie."
                .formatted(nomeExistente, codigo);
    }
}
