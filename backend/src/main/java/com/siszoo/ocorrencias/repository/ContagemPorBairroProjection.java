package com.siszoo.ocorrencias.repository;

// Relatorio de ocorrencias por bairro.
public interface ContagemPorBairroProjection {

    String getBairro();

    long getQuantidade();
}
