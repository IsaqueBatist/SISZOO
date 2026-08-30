package com.siszoo.usuarios.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.siszoo.usuarios.entity.AcaoAuditoria;

public record AuditoriaEventoResponse(
        UUID id,
        String usuarioEmail,
        AcaoAuditoria acao,
        String entidade,
        LocalDateTime ocorreuEm) {
}
