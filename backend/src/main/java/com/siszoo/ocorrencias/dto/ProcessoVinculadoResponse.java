package com.siszoo.ocorrencias.dto;

import java.util.UUID;

import com.siszoo.processos.entity.StatusProcesso;

public record ProcessoVinculadoResponse(
        UUID id,
        String protocolo,
        StatusProcesso statusProcesso,
        boolean urgente) {
}
