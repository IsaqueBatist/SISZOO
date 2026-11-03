package com.siszoo.animais.service;

import java.util.Arrays;
import java.util.Optional;

public enum PendenciaAnimal {
    FICHA_INCOMPLETA("ficha_incompleta"),
    SEM_AVALIACAO_30D("sem_avaliacao_30d"),
    NAO_CASTRADO("nao_castrado"),
    MEDICACAO_TERMINANDO("medicacao_ativa");

    public static final int DIAS_SEM_AVALIACAO = 30;
    public static final int DIAS_ANTECEDENCIA_MEDICACAO = 7;
    public static final String STATUS_DISPONIVEL_ADOCAO = "disponivel_adocao";

    private final String codigo;

    PendenciaAnimal(String codigo) {
        this.codigo = codigo;
    }

    public String getCodigo() {
        return codigo;
    }

    public static Optional<PendenciaAnimal> doCodigo(String codigo) {
        return Arrays.stream(values()).filter(pendencia -> pendencia.codigo.equals(codigo)).findFirst();
    }
}
