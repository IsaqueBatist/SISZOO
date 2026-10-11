package com.siszoo.processos.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import com.siszoo.processos.entity.StatusProcesso;

public record ProcessoSanitarioResponse(
        UUID id,
        String protocolo,
        LocalDate dataAbertura,
        UUID ocorrenciaId,
        boolean urgente,
        StatusProcesso statusProcesso,
        LocalDateTime criadoEm) {
}
