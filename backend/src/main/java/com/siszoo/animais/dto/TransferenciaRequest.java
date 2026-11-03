package com.siszoo.animais.dto;

import java.time.LocalDateTime;

import org.springframework.util.StringUtils;

import jakarta.validation.constraints.Size;

public record TransferenciaRequest(
        String tipoDestino,

        @Size(max = 200)
        String destino,

        LocalDateTime dataSaida,

        @Size(max = 120)
        String documento) {

    public boolean temAlgumDado() {
        return StringUtils.hasText(tipoDestino) || StringUtils.hasText(destino) || dataSaida != null
                || StringUtils.hasText(documento);
    }
}
