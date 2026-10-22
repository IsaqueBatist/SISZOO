package com.siszoo.relatorios.dto;

import java.time.LocalDate;

// microchip nao aparece aqui (não está no protótipo para esta tabela);
// procedimento e resultado podem ser "—" quando o registro nao tem descricao/resultado.
public record CirurgiaRealizadaResponse(
        LocalDate data, String animal, String procedimento, String veterinario, String resultado) {
}
