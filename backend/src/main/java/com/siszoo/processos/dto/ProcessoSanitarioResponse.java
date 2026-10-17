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
// resultadoLaboratorial/dataResultado/desfechoAnimal sao da T37 — nulos
// enquanto o processo nao chega em AGUARDANDO_RESULTADO ou nao tem resultado
// lancado ainda. galNumero/sinanNumero/dataEnvioAmostras/previsaoRetorno nao
// entram aqui: nenhum fluxo os preenche ainda (fica para quem implementar o
// envio de amostras de verdade).
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
        CatalogoItemResponse resultadoLaboratorial,
        LocalDate dataResultado,
        CatalogoItemResponse desfechoAnimal,
        LocalDateTime criadoEm) {
}
