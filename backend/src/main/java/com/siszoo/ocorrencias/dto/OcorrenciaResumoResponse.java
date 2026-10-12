package com.siszoo.ocorrencias.dto;

import java.time.LocalDate;
import java.util.UUID;

import com.siszoo.ocorrencias.entity.StatusOcorrencia;

// Linha da listagem. denuncianteNome e null em ocorrencia sigilosa para todos
// os perfis (T26, revisao da D14): o nome so sai no detalhe, que e auditado.
public record OcorrenciaResumoResponse(
        UUID id,
        String protocolo,
        String tipoOcorrencia,
        String tipoOcorrenciaNome,
        StatusOcorrencia statusOcorrencia,
        LocalDate dataAbertura,
        String bairro,
        boolean urgente,
        boolean sigilosa,
        boolean anonima,
        String denuncianteNome,
        String processoProtocolo,
        boolean podeVerDenunciante) {
}
