package com.siszoo.comum.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErroResponse(String mensagem, List<CampoInvalido> campos) {

    public ErroResponse(String mensagem) {
        this(mensagem, null);
    }

    public record CampoInvalido(String campo, String mensagem) {
    }
}
