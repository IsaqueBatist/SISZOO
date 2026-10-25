package com.siszoo.processos.dto;

import java.time.LocalDate;
import java.util.UUID;

import com.siszoo.comum.dto.CatalogoItemResponse;
import com.siszoo.processos.entity.StatusProcesso;

// Linha da listagem de processos: sem responsavel nem amostras (o detalhe
// traz os dois). ocorrenciaProtocolo evita buscar a ocorrencia so para exibir
// o numero (e nao entrega dado de denunciante).
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
