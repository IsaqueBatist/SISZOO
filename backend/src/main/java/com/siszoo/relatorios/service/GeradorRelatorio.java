package com.siszoo.relatorios.service;

import java.util.List;

import com.siszoo.comum.util.BlocoCsv;
import com.siszoo.relatorios.dto.PeriodoRelatorio;
import com.siszoo.relatorios.entity.TipoRelatorio;

// Um service por tipo de relatorio: colunas e secoes sao heterogeneas
// entre os 6 tipos, um service/DTO generico perderia tipagem. gerarPreview e
// usado pelo JSON de preview e pelo PDF (secoes longas vem "top N + Outros");
// blocosCsv e so para o CSV, que exporta a(s) secao(oes) tabulares completas,
// sem agregacao de excedente - para tipos sem lista longa (ex.:
// ocupacao_baias), pode reaproveitar a mesma consulta do preview.
public interface GeradorRelatorio<T> {

    TipoRelatorio tipo();

    T gerarPreview(PeriodoRelatorio periodo);

    List<BlocoCsv> blocosCsv(PeriodoRelatorio periodo);

    // Para quem nao tem RELATORIOS:ocorrencias_bairro:leitura (V32). So o relatorio
    // anual mistura bairros com outras secoes; nos demais nao ha o que tirar.
    default T gerarPreviewSemBairros(PeriodoRelatorio periodo) {
        return gerarPreview(periodo);
    }

    default List<BlocoCsv> blocosCsvSemBairros(PeriodoRelatorio periodo) {
        return blocosCsv(periodo);
    }
}
