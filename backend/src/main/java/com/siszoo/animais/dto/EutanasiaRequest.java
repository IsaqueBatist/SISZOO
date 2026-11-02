package com.siszoo.animais.dto;

import jakarta.validation.constraints.Size;

public record EutanasiaRequest(
        @Size(max = 120)
        String metodo,

        Boolean insensibilizacaoPrevia) {
}
