package com.siszoo.ocorrencias.repository;

import java.time.LocalDateTime;

// Relatorio de ocorrencias por bairro (T41): uma linha por ocorrencia
// ENCERRADA no periodo — o service calcula a duracao (criadoEm -> encerradaEm)
// em Java (JPQL nao tem funcao portavel de diferenca de datas em horas).
public interface TempoAtendimentoProjection {

    String getBairro();

    LocalDateTime getCriadoEm();

    LocalDateTime getEncerradaEm();
}
