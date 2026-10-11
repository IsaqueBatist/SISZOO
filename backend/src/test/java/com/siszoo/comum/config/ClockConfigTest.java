package com.siszoo.comum.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.ZoneId;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

// Os *IT substituem o Clock por um fixo (@Primary), entao nenhum deles
// enxerga o bean de producao. Sem este teste, trocar a zona de ClockConfig
// para UTC deixaria a suite inteira verde e quebraria RN-A06/RN-C06 entre
// 21:00 e 00:00 no horario de Itu.
class ClockConfigTest {

    @Test
    @DisplayName("[RN-A06] Clock de producao usa o fuso de America/Sao_Paulo")
    void clockDeProducaoDeveUsarOFusoDeSaoPaulo() {
        assertThat(new ClockConfig().clock().getZone()).isEqualTo(ZoneId.of("America/Sao_Paulo"));
    }
}
