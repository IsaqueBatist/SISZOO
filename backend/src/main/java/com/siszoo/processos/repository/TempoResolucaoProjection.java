package com.siszoo.processos.repository;

import java.time.LocalDate;

public interface TempoResolucaoProjection {

    LocalDate getDataAbertura();

    LocalDate getDataResultado();
}
