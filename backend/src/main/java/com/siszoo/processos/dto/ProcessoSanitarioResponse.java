package com.siszoo.processos.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.siszoo.comum.dto.CatalogoItemResponse;
import com.siszoo.processos.entity.StatusProcesso;

public record ProcessoSanitarioResponse(
        UUID id,
        String protocolo,
        LocalDate dataAbertura,
        UUID ocorrenciaId,
        String ocorrenciaProtocolo,
        boolean urgente,
        StatusProcesso statusProcesso,
        CatalogoItemResponse doenca,
        String cid,
        CatalogoItemResponse laboratorio,
        String observacoes,
        ResponsavelProcessoResponse responsavel,
        List<AmostraAnimalResponse> amostras,
        LocalDateTime criadoEm,
        CatalogoItemResponse resultado,
        LocalDate dataResultado,
        CatalogoItemResponse desfechoAnimal,
        List<ResultadoProcessoResponse> resultados,
        LocalDateTime dataNotificacaoMunicipe,
        String galNumero,
        String sinanNumero) {
}
