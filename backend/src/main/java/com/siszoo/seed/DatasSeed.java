package com.siszoo.seed;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

// Datas do seed relativas a "hoje" do Clock do projeto (America/Sao_Paulo; o
// fixo de RelogioTesteConfig nos testes), nunca futuras para fatos ocorridos.
// Os services carimbam com a hora real o que eles mesmos gravam (criado_em,
// encerramento, movimentacoes, auditoria): so as datas de negocio vem daqui
// (docs/decisoes/seed-dev.md, SD-5).
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

    // Manha do dia, para nunca cair no futuro quando o dia e hoje.
    LocalDateTime entradaHa(int dias) {
        return diasAtras(dias).atTime(LocalTime.of(8, 0).plusMinutes(dias % 7 * 20L));
    }

    // Vacinas da V5 valem 12 meses: aplicada assim, a validade cai em
    // hoje + dias (negativo = ja vencida).
    LocalDate aplicacaoComValidadeEm(int dias) {
        return hoje.plusDays(dias).minusMonths(12);
    }

    // Processos espalhados pelo ano corrente (graficos e relatorio anual sao
    // por ano). `fracao` em [0, 1]: 0 = 1o de janeiro, 1 = hoje. No comeco do
    // ano (menos de 60 dias), cai nos ultimos 300 dias.
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
