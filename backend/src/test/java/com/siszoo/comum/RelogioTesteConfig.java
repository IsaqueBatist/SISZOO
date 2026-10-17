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
//
// T30: o instante pode ser trocado (fixarEm) para os testes de concorrencia
// pela API isolarem um ano de protocolo com sequencia vazia. Os *IT rodam em
// sequencia (failsafe sem configuracao de paralelismo), e quem troca restaura
// (restaurar) no finally e no @AfterEach da classe; fora disso, o instante e
// sempre o fixo abaixo.
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
