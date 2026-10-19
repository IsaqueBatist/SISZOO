package com.siszoo.comum.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

// `campos` e aditivo: so vem preenchido em erro de validacao (422 "Dados
// invalidos") e em regra de negocio presa a um campo (422 de
// CampoInvalidoException), com um item por campo rejeitado. Nos demais erros
// fica nulo e fora do JSON, entao o corpo continua sendo so {"mensagem": ...}.
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErroResponse(String mensagem, List<CampoInvalido> campos) {

    public ErroResponse(String mensagem) {
        this(mensagem, null);
    }

    public record CampoInvalido(String campo, String mensagem) {
    }
}
