package com.siszoo.processos.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.siszoo.animais.dto.CatalogoItemResponse;
import com.siszoo.processos.entity.StatusProcesso;

// Os campos da versao minima (T25) continuam com os mesmos nomes; os da T29
// e da T34 sao aditivos. ocorrenciaProtocolo (T32) permite exibir o vinculo
// sem buscar a ocorrencia (que exige acesso ao modulo e audita o sigilo,
// T26). resultado/dataResultado sao o vigente (nulos sem resultado);
// resultados e o historico, do original a ultima correcao (T34).
// desfechoAnimal (T37) nao entra no historico imutavel — e so do processo.
// galNumero/sinanNumero/dataEnvioAmostras/previsaoRetorno nao entram aqui:
// nenhum fluxo os preenche ainda (fica para quem implementar o envio de
// amostras de verdade).
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
        List<ResultadoProcessoResponse> resultados) {
}
