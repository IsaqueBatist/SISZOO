package com.siszoo.alertas.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record AlertaEsterilizacaoAnimalResponse(
        UUID animalId,
        String animalNome,
        String animalMicrochip,
        String animalEspecieNome,
        String animalSexo,
        String animalBaiaNome,
        String animalStatusNome,
        LocalDateTime dataEntrada,
        long horasDesdeEntrada) {
}
