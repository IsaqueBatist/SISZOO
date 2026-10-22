package com.siszoo.processos.repository;

import java.time.LocalDate;

// Relatorio Anual de Processos (T41), coluna "Tempo médio (dias)" de
// "Laboratórios utilizados": dataEnvioAmostras nunca e preenchida por nenhum
// fluxo hoje (ver ProcessoSanitarioResponse), entao usamos
// dataAbertura -> dataResultado como proxy, agrupado por laboratorio —
// decisao validada com o usuario, documentada tambem no PR.
public interface TempoResolucaoPorLaboratorioProjection {

    String getLaboratorioCodigo();

    LocalDate getDataAbertura();

    LocalDate getDataResultado();
}
