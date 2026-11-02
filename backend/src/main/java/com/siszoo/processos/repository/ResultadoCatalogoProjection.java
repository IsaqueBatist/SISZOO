package com.siszoo.processos.repository;

// Grafico "Resultados Laboratoriais" do dashboard (com.siszoo.relatorios).
public interface ResultadoCatalogoProjection {

    String getCodigo();

    String getNome();

    long getPositivos();

    long getNegativos();
}
