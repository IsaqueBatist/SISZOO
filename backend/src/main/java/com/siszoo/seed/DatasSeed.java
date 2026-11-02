package com.siszoo.seed;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

final class DatasSeed {

    private final LocalDate hoje;

    DatasSeed(Clock clock) {
        this.hoje = LocalDate.now(clock);
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
