package com.siszoo.alertas.dto;

import java.time.LocalDate;
import java.util.UUID;

public record AlertaVacinalItemResponse(
        UUID vacinacaoId,
        UUID vacinaId,
        String vacinaNome,
        LocalDate dataAplicacao,
        LocalDate dataValidade,
        long diasRestantes,
        SeveridadeAlerta severidade,
        String veterinarioNome) {
}
