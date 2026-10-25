package com.siszoo.processos.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.siszoo.processos.entity.StatusProcesso;

// Snapshot de auditoria do processo: sem nenhum dado pessoal do responsavel
// (nome, CPF, telefone, e-mail, CEP, endereco, bairros), pelo mesmo motivo da
// D23 — a auditoria nao replica o dado pessoal. As amostras entram (dados do
// animal e da coleta). resultado/dataResultado: o vigente (T34).
// desfechoAnimal (T37) e codigo de catalogo, sem dado pessoal.
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

    // O estado anterior e capturado antes da mutacao, mas as amostras sao
    // lidas uma vez so, depois da gravacao, e entram aqui. So vale para
    // operacoes que nao gravam amostra.
    public ProcessoAuditoriaSnapshot comAmostras(List<AmostraAnimalResponse> lidas) {
        return new ProcessoAuditoriaSnapshot(id, protocolo, dataAbertura, ocorrenciaId, urgente, statusProcesso,
                doenca, cid, laboratorio, observacoes, lidas, resultado, dataResultado, desfechoAnimal);
    }
}
