package com.siszoo.comum;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

// Relogio fixo compartilhado pelos *IT que dependem de "hoje" (RN-A01..A06,
// RN-C06). Uma classe so, importada igual em todos, faz o Spring reaproveitar
// o mesmo contexto em cache em vez de subir um por classe de teste.
// Ancora no dia 10 ao meio-dia local: longe da virada de mes (plusMonths/
// minusMonths nao sofrem ajuste de fim de mes) e da virada de dia UTC x local.
// O JwtService valida expiracao com este mesmo Clock, entao tokens emitidos
// "em 2026-09-10" continuam validos mesmo com a data real posterior.
@TestConfiguration
public class RelogioTesteConfig {

    public static final ZoneId FUSO = ZoneId.of("America/Sao_Paulo");
    public static final LocalDate HOJE = LocalDate.of(2026, 9, 10);

    @Bean
    @Primary
    Clock relogioFixoDeTeste() {
        return Clock.fixed(Instant.parse("2026-09-10T15:00:00Z"), FUSO);
    }
}
