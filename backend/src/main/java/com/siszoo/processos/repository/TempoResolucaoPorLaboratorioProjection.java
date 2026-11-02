package com.siszoo.processos.repository;

import java.time.LocalDate;

// Relatorio Anual de Processos, coluna "Tempo médio (dias)" de
// "Laboratórios utilizados": dataEnvioAmostras nunca e preenchida por nenhum
// fluxo hoje (ver ProcessoSanitarioResponse), entao usamos
// dataAbertura -> dataResultado como proxy, agrupado por laboratorio.
public interface TempoResolucaoPorLaboratorioProjection {

    String getLaboratorioCodigo();

    LocalDate getDataAbertura();

    LocalDate getDataResultado();
}
