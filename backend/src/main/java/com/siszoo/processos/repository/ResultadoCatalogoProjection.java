package com.siszoo.processos.repository;

// Grafico "Resultados Laboratoriais" do dashboard (com.siszoo.relatorios, T38).
public interface ResultadoCatalogoProjection {

    String getCodigo();

    String getNome();

    long getPositivos();

    long getNegativos();
}
