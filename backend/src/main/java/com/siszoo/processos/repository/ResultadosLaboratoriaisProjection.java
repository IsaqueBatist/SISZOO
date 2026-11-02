package com.siszoo.processos.repository;

public interface ResultadosLaboratoriaisProjection {

    String getNome();

    long getInvestigados();

    long getPositivos();

    long getNegativos();

    long getInconclusivos();

    long getAguardando();
}
