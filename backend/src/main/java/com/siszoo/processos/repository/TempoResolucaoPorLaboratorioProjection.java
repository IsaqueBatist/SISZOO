package com.siszoo.processos.repository;

import java.time.LocalDate;

public interface TempoResolucaoPorLaboratorioProjection {

    String getLaboratorioCodigo();

    LocalDate getDataAbertura();

    LocalDate getDataResultado();
}
