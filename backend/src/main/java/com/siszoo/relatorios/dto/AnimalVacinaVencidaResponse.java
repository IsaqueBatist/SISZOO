package com.siszoo.relatorios.dto;

public record AnimalVacinaVencidaResponse(
        String animal,
        String microchip,
        String baia,
        String vacina,
        long diasAtraso) {
}
