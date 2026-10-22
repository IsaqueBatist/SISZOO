package com.siszoo.ocorrencias.repository;

// Relatorio de ocorrencias por bairro (T41): base para o service escolher o
// tipo predominante de cada bairro (maior quantidade).
public interface BairroTipoProjection {

    String getBairro();

    String getTipo();

    long getQuantidade();
}
