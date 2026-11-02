package com.siszoo.animais.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.siszoo.animais.entity.TipoDestinoTransferencia;
import com.siszoo.comum.dto.CatalogoItemResponse;

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
        Boolean esterilizado,
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
        LocalDateTime atualizadoEm,
        String numeroMedalha,
        LocalDate dataImplantacaoChip,
        String procedencia,
        String laudoEutanasia,
        List<CatalogoItemResponse> condicoes,
        String condicoesOutras,
        TipoDestinoTransferencia tipoDestinoTransferencia,
        String destinoTransferencia,
        LocalDateTime dataSaida,
        String documentoTransferencia,
        UUID laudoEutanasiaResponsavelId,
        String laudoEutanasiaResponsavelNome,
        String laudoEutanasiaCrmv,
        String laudoEutanasiaMetodo,
        Boolean laudoEutanasiaInsensibilizacaoPrevia,
        LocalDateTime laudoEutanasiaRegistradoEm) {
}
