package com.siszoo.alertas.dto;

import java.util.List;
import java.util.UUID;

public record AlertaVacinalAnimalResponse(
        UUID animalId,
        String animalNome,
        String animalMicrochip,
        String animalEspecieNome,
        String animalSexo,
        String animalBaiaNome,
        List<AlertaVacinalItemResponse> vacinas) {
}
