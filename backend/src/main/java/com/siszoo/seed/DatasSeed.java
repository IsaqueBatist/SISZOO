package com.siszoo.seed;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

final class DatasSeed {

    private final LocalDate hoje;
    private final LocalDateTime agora;

    DatasSeed(Clock clock) {
        this.hoje = LocalDate.now(clock);
        this.agora = LocalDateTime.now(clock);
    }

    LocalDate hoje() {
        return hoje;
    }

    LocalDate diasAtras(int dias) {
        return hoje.minusDays(dias);
    }

    LocalDate diasAFrente(int dias) {
        return hoje.plusDays(dias);
    }

    LocalDateTime entradaHa(int dias) {
        return diasAtras(dias).atTime(LocalTime.of(8, 0).plusMinutes(dias % 7 * 20L));
    }

    /**
     * Entrada contada em horas, e não em dias, para posicionar animais nos dois lados do limite de
     * 72 h do {@code AlertaEsterilizacaoService}. O alerta recalcula o limite a cada requisição, com
     * a hora corrente: um animal semeado com 60 h entra no alerta 12 h depois da execução do seed.
     * As janelas estreitas têm prazo de validade, como diz a SD-5 — para renová-las, recrie o banco.
     */
    LocalDateTime entradaHorasAtras(int horas) {
        return agora.minusHours(horas).withSecond(0).withNano(0);
    }

    LocalDate aplicacaoComValidadeEm(int dias) {
        return hoje.plusDays(dias).minusMonths(12);
    }

    LocalDate noAnoCorrente(double fracao) {
        LocalDate inicioDoAno = hoje.withDayOfYear(1);
        int decorridos = hoje.getDayOfYear() - 1;
        if (decorridos < 60) {
            return diasAtras((int) Math.round((1 - fracao) * 300));
        }
        return inicioDoAno.plusDays(Math.round(fracao * decorridos));
    }

    LocalDate minimo(LocalDate data, LocalDate limite) {
        return data.isAfter(limite) ? limite : data;
    }
}
