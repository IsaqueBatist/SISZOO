package com.siszoo.ocorrencias.repository;

import java.time.LocalDateTime;

public interface TempoAtendimentoProjection {

    String getBairro();

    LocalDateTime getCriadoEm();

    LocalDateTime getEncerradaEm();
}
