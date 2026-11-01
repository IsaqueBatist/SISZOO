package com.siszoo.animais.clinico.dto;

import java.util.UUID;

// `intervaloMeses` sai aqui para a interface conseguir PREVER o proximo reforco
// enquanto o formulario e preenchido. A data de reforco de uma vacinacao JA
// gravada continua vindo de VacinacaoResponse.dataValidade, que e a fonte unica
// da RN-A01 (Vacinacao.calcularDataValidade) — nao recalcular a partir daqui.
public record VacinaResponse(
        UUID id,
        String codigo,
        String nome,
        Integer intervaloMeses,
        boolean ativo) {
}
