package com.siszoo.processos.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.siszoo.animais.dto.CatalogoItemResponse;
import com.siszoo.processos.entity.StatusProcesso;

// Os campos da versao minima (T25) continuam com os mesmos nomes; os da T29
// e da T34 sao aditivos. resultado/dataResultado sao o vigente (nulos sem
// resultado); resultados e o historico, do original a ultima correcao.
public record ProcessoSanitarioResponse(
        UUID id,
        String protocolo,
        LocalDate dataAbertura,
        UUID ocorrenciaId,
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
        List<ResultadoProcessoResponse> resultados) {
}
