package com.siszoo.relatorios.dto;

// microchip/baia podem ser "—" (null): microchip nao e obrigatorio e baia e
// opcional (animal pode estar fora de instalacao fisica cadastrada).
public record AnimalVacinaVencidaResponse(
        String animal,
        String microchip,
        String baia,
        String vacina,
        long diasAtraso) {
}
