package com.siszoo.processos.repository;

// Relatorio Anual de Processos (T41), secao "Bairros com mais ocorrências":
// so processos com ocorrencia vinculada (o vinculo e opcional, DER regra 15).
public interface BairroProcessoProjection {

    String getBairro();

    long getProcessos();

    long getPositivos();
}
