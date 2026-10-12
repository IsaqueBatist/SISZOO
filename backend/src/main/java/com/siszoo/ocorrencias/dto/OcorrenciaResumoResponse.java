package com.siszoo.ocorrencias.dto;

import java.time.LocalDate;
import java.util.UUID;

import com.siszoo.ocorrencias.entity.StatusOcorrencia;

// Linha da listagem. denuncianteNome segue a mesma mascara do detalhe (D14).
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
