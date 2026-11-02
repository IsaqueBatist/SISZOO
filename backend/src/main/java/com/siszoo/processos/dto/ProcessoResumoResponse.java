package com.siszoo.processos.dto;

import java.time.LocalDate;
import java.util.UUID;

import com.siszoo.comum.dto.CatalogoItemResponse;
import com.siszoo.processos.entity.StatusProcesso;

public record ProcessoResumoResponse(
        UUID id,
        String protocolo,
        LocalDate dataAbertura,
        CatalogoItemResponse doenca,
        StatusProcesso statusProcesso,
        boolean urgente,
        UUID ocorrenciaId,
        String ocorrenciaProtocolo) {
}
