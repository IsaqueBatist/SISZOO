package com.siszoo.comum;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

@TestConfiguration
public class RelogioTesteConfig {

    public static final ZoneId FUSO = ZoneId.of("America/Sao_Paulo");
    public static final LocalDate HOJE = LocalDate.of(2026, 9, 10);
    public static final Instant AGORA = Instant.parse("2026-09-10T15:00:00Z");

    private static final RelogioAjustavel RELOGIO = new RelogioAjustavel();

    @Bean
    @Primary
    Clock relogioFixoDeTeste() {
        return RELOGIO;
    }

    public static void avancar(Duration tempo) {
        RELOGIO.atual = Clock.fixed(RELOGIO.instant().plus(tempo), FUSO);
    }

    public static void fixarEm(Instant instante) {
        RELOGIO.atual = Clock.fixed(instante, FUSO);
    }

    public static void restaurar() {
        RELOGIO.atual = Clock.fixed(AGORA, FUSO);
    }

    private static final class RelogioAjustavel extends Clock {

        private volatile Clock atual = Clock.fixed(AGORA, FUSO);

        @Override
        public ZoneId getZone() {
            return atual.getZone();
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return Clock.fixed(atual.instant(), zone);
        }

        @Override
        public Instant instant() {
            return atual.instant();
        }
    }
}
