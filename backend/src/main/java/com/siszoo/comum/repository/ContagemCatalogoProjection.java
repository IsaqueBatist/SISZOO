package com.siszoo.comum.repository;

// Projecao generica codigo/nome/quantidade para graficos agregados do
// dashboard (com.siszoo.relatorios, T38): usada tanto por
// ProcessoSanitarioRepository#contarPorDoenca quanto por
// AnimalAmostradoRepository#contarRaivaPorEspecie.
public interface ContagemCatalogoProjection {

    String getCodigo();

    String getNome();

    long getQuantidade();
}
