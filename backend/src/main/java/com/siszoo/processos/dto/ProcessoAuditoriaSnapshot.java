package com.siszoo.processos.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.siszoo.processos.entity.StatusProcesso;

public record ProcessoAuditoriaSnapshot(
        UUID id,
        String protocolo,
        LocalDate dataAbertura,
        UUID ocorrenciaId,
        boolean urgente,
        StatusProcesso statusProcesso,
        String doenca,
        String cid,
        String laboratorio,
        String observacoes,
        List<AmostraAnimalResponse> amostras,
        String resultado,
        LocalDate dataResultado,
        String desfechoAnimal) {

    public ProcessoAuditoriaSnapshot comAmostras(List<AmostraAnimalResponse> lidas) {
        return new ProcessoAuditoriaSnapshot(id, protocolo, dataAbertura, ocorrenciaId, urgente, statusProcesso,
                doenca, cid, laboratorio, observacoes, lidas, resultado, dataResultado, desfechoAnimal);
    }
}
