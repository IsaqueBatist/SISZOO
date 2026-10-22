package com.siszoo.processos.repository;

// Relatorio Anual de Processos (T41): base para o service escolher as
// doencas predominantes de cada bairro (as 2 com mais processos).
public interface BairroDoencaProjection {

    String getBairro();

    String getDoenca();

    long getQuantidade();
}
