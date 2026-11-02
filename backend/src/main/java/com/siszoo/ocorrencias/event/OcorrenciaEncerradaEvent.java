package com.siszoo.ocorrencias.event;

import java.util.UUID;

public record OcorrenciaEncerradaEvent(UUID ocorrenciaId, UUID autorId) {
}
