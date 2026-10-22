package com.siszoo.relatorios.entity;

import java.util.Locale;

// Os 6 tipos de relatorio (DER §3.6), fixos: cada um exige uma classe de
// agregacao propria no backend, entao uma tabela catalogo so para isso seria
// sobre-engenharia (divergencia documentada no DER). Nomes de exibicao e tipo
// de filtro vem do prototipo (docs/prototipo/relatorios.html). "codigo" e a
// forma lowercase usada na API e no catalogo tipo_relatorio do DER
// (ex.: "ocupacao_baias"); o nome do enum e so uso interno Java.
public enum TipoRelatorio {
    ANUAL_PROCESSOS("Relatório Anual de Processos", FiltroEsperado.ANO),
    VACINACAO("Relatório de Vacinação", FiltroEsperado.PERIODO),
    ADOCOES("Relatório de Adoções", FiltroEsperado.PERIODO),
    PROCEDIMENTOS("Relatório de Procedimentos", FiltroEsperado.PERIODO),
    OCUPACAO_BAIAS("Ocupação de Baias", FiltroEsperado.JANELA),
    OCORRENCIAS_BAIRRO("Ocorrências por Bairro", FiltroEsperado.PERIODO);

    public enum FiltroEsperado { ANO, JANELA, PERIODO }

    private final String nomeExibicao;
    private final FiltroEsperado filtroEsperado;

    TipoRelatorio(String nomeExibicao, FiltroEsperado filtroEsperado) {
        this.nomeExibicao = nomeExibicao;
        this.filtroEsperado = filtroEsperado;
    }

    public String codigo() {
        return name().toLowerCase(Locale.ROOT);
    }

    public String nomeExibicao() {
        return nomeExibicao;
    }

    public FiltroEsperado filtroEsperado() {
        return filtroEsperado;
    }

    public static TipoRelatorio deCodigo(String codigo) {
        for (TipoRelatorio tipo : values()) {
            if (tipo.codigo().equals(codigo)) {
                return tipo;
            }
        }
        throw new IllegalArgumentException("Tipo de relatório inválido: " + codigo);
    }
}
