package com.siszoo.processos.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.siszoo.animais.dto.CatalogoItemResponse;
import com.siszoo.processos.entity.StatusProcesso;

// Os campos da versao minima (T25) continuam com os mesmos nomes; os da T29
// sao aditivos. ocorrenciaProtocolo permite exibir o vinculo sem buscar a
// ocorrencia (que exige acesso ao modulo e audita o sigilo, T26).
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
        LocalDateTime criadoEm) {
}
