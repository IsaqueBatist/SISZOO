package com.siszoo.ocorrencias.dto;

import java.time.LocalDate;
import java.util.UUID;

public record OrigemAnimalResponse(
        UUID ocorrenciaId,
        String protocolo,
        boolean sigilosa,
        String tipoOcorrenciaNome,
        LocalDate dataAbertura) {
}
