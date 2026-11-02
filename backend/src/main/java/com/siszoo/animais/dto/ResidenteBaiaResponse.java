package com.siszoo.animais.dto;

import java.util.UUID;

public record ResidenteBaiaResponse(UUID baiaId, UUID id, String nome, String fotoUrl) {
}
