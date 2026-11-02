package com.siszoo.processos.repository;

import java.time.LocalDate;

// Relatorio Anual de Processos: o service calcula dataResultado -
// dataAbertura em dias (JPQL nao tem diferenca de datas portavel).
public interface TempoResolucaoProjection {

    LocalDate getDataAbertura();

    LocalDate getDataResultado();
}
