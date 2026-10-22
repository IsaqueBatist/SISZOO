package com.siszoo.processos.repository;

// Relatorio Anual de Processos (T41), secao "Resultados Laboratoriais":
// escopo por dataAbertura do processo (ano do relatorio), nao por
// dataResultado como o grafico do dashboard (ContagemCatalogoProjection /
// contarResultadosPorDoenca) — aqui o universo e "processos ABERTOS no ano",
// nao "resultados LANCADOS no ano".
public interface ResultadosLaboratoriaisProjection {

    String getCodigo();

    String getNome();

    long getInvestigados();

    long getPositivos();

    long getNegativos();

    long getInconclusivos();

    long getAguardando();
}
