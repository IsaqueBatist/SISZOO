package com.siszoo.animais.clinico.repository;

// Relatorio de procedimentos, secao "Produtividade por veterinário" (T41):
// quantidade de procedimentos de um `tipoCodigo` (atendimento_clinico,
// castracao ou cirurgia_maior) executados por um veterinario no periodo.
public interface ProdutividadeProcedimentoProjection {

    String getNome();

    String getTipoCodigo();

    long getQuantidade();
}
