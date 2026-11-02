package com.siszoo.relatorios.service;

import java.util.List;

import com.siszoo.comum.util.BlocoCsv;
import com.siszoo.relatorios.dto.PeriodoRelatorio;
import com.siszoo.relatorios.entity.TipoRelatorio;

public interface GeradorRelatorio<T> {

    TipoRelatorio tipo();

    T gerarPreview(PeriodoRelatorio periodo);

    List<BlocoCsv> blocosCsv(PeriodoRelatorio periodo);

    default T gerarPreviewSemBairros(PeriodoRelatorio periodo) {
        return gerarPreview(periodo);
    }

    default List<BlocoCsv> blocosCsvSemBairros(PeriodoRelatorio periodo) {
        return blocosCsv(periodo);
    }
}
