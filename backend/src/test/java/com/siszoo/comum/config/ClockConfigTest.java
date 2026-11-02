package com.siszoo.comum.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.ZoneId;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class ClockConfigTest {

    @Test
    @DisplayName("[RN-A06] Clock de producao usa o fuso de America/Sao_Paulo")
    void clockDeProducaoDeveUsarOFusoDeSaoPaulo() {
        assertThat(new ClockConfig().clock().getZone()).isEqualTo(ZoneId.of("America/Sao_Paulo"));
    }
}
