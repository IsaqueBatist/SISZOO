package com.siszoo.animais.repository;

// Relatorio de adocoes: contagem generica por uma caracteristica do
// animal (especie ou porte).
public interface ContagemPorCaracteristicaProjection {

    String getCaracteristica();

    long getQuantidade();
}
