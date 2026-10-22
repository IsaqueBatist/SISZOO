package com.siszoo.ocorrencias.repository;

// Relatorio de ocorrencias por bairro (T41).
public interface ContagemPorBairroProjection {

    String getBairro();

    long getQuantidade();
}
