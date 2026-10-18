package com.siszoo.processos.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.siszoo.processos.entity.StatusProcesso;

// Snapshot de auditoria do processo: sem nenhum dado pessoal do responsavel
// (nome, CPF, telefone, e-mail, CEP, endereco, bairros), pelo mesmo motivo da
// D23 — a auditoria nao replica o dado pessoal. As amostras entram (dados do
// animal e da coleta). resultadoLaboratorial/dataResultado/desfechoAnimal
// (T37) sao codigos de catalogo, sem dado pessoal.
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
        String resultadoLaboratorial,
        LocalDate dataResultado,
        String desfechoAnimal) {
}
