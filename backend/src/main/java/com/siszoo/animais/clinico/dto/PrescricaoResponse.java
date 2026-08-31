package com.siszoo.animais.clinico.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import com.siszoo.animais.clinico.entity.StatusPrescricao;
import com.siszoo.animais.clinico.entity.UnidadeDose;
import com.siszoo.animais.clinico.entity.UnidadeFrequencia;
import com.siszoo.animais.clinico.entity.ViaAdministracao;

public record PrescricaoResponse(
        UUID id,
        UUID animalId,
        UUID medicamentoId,
        String medicamentoNome,
        UUID prescritoPorId,
        String prescritoPorNome,
        LocalDate dataInicio,
        LocalDate dataFimPrevista,
        LocalDate dataFimReal,
        Integer frequenciaAplicada,
        UnidadeFrequencia unidadeFrequencia,
        BigDecimal doseQuantidade,
        UnidadeDose doseUnidade,
        ViaAdministracao viaAdministracao,
        StatusPrescricao status,
        UUID retificaId,
        UUID retificadoPorId,
        String statusRegistro,
        LocalDateTime criadoEm) {
}
