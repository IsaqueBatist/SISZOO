package com.siszoo.animais.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record AnimalResponse(
        UUID id,
        String nome,
        String especieCodigo,
        String especieNome,
        String sexo,
        String raca,
        String coloracao,
        String pelagem,
        String porte,
        BigDecimal pesoKg,
        String idadeAprox,
        LocalDate dataNascimentoAprox,
        String microchip,
        boolean esterilizado,
        LocalDate dataEsterilizacao,
        String statusCodigo,
        String statusNome,
        String motivoEntradaCodigo,
        String motivoEntradaNome,
        LocalDateTime dataEntrada,
        UUID baiaId,
        String baiaNome,
        String tipoBaiaNome,
        boolean fichaCompleta,
        String fotoUrl,
        String observacoes,
        UUID criadoPorId,
        String criadoPorNome,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm) {
}
