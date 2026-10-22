package com.siszoo.animais.clinico.repository;

// Relatorio de vacinacao, secao "Aplicações por Veterinário" (T41).
public interface AplicacaoPorVeterinarioProjection {

    String getNome();

    long getQuantidade();
}
