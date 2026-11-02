package com.siszoo.ocorrencias.repository;

// Relatorio de ocorrencias por bairro: base para o service escolher o
// tipo predominante de cada bairro (maior quantidade).
public interface BairroTipoProjection {

    String getBairro();

    String getTipo();

    long getQuantidade();
}
