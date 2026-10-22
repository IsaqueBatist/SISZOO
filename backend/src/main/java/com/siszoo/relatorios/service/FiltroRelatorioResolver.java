package com.siszoo.relatorios.service;

import java.time.Clock;
import java.time.LocalDate;
import java.util.Locale;

import org.springframework.stereotype.Service;

import com.siszoo.comum.exception.CampoInvalidoException;
import com.siszoo.relatorios.dto.FiltroRelatorioBruto;
import com.siszoo.relatorios.dto.PeriodoRelatorio;
import com.siszoo.relatorios.entity.TipoRelatorio;

// Cada um dos 6 tipos usa um filtro de tela diferente (DER §3.6, protótipos
// docs/prototipo/relatorios.html): anual_processos usa "ano"; ocupacao_baias
// usa "janela" (ultimos_6_meses | ultimos_12_meses | custom); os demais usam
// periodo explicito. Este resolver traduz qualquer um desses formatos para um
// PeriodoRelatorio sempre concreto ANTES de qualquer agregacao ou gravacao em
// relatorio_gerado (periodo_inicio/periodo_fim sao NOT NULL, V20) — "hoje"
// sempre via Clock, nunca LocalDate.now() direto.
@Service
public class FiltroRelatorioResolver {

    public static final String JANELA_ULTIMOS_6_MESES = "ultimos_6_meses";
    public static final String JANELA_ULTIMOS_12_MESES = "ultimos_12_meses";
    public static final String JANELA_CUSTOM = "custom";

    private final Clock clock;

    public FiltroRelatorioResolver(Clock clock) {
        this.clock = clock;
    }

    public TipoRelatorio tipoPorCodigo(String codigo) {
        try {
            return TipoRelatorio.deCodigo(codigo);
        } catch (IllegalArgumentException ex) {
            throw new CampoInvalidoException("tipo", "Tipo de relatório inválido");
        }
    }

    public PeriodoRelatorio resolver(FiltroRelatorioBruto filtro) {
        if (filtro.tipo() == null) {
            throw new CampoInvalidoException("tipo", "Tipo de relatório é obrigatório");
        }
        return switch (filtro.tipo()) {
            case ANUAL_PROCESSOS -> resolverPorAno(filtro);
            case OCUPACAO_BAIAS -> resolverPorJanela(filtro);
            case VACINACAO, ADOCOES, PROCEDIMENTOS, OCORRENCIAS_BAIRRO -> resolverPorPeriodoExplicito(filtro);
        };
    }

    // anual_processos: so aceita "ano" — periodo explicito junto seria
    // ambiguidade de integracao do front, por isso e rejeitado (nao ignorado
    // em silencio).
    private PeriodoRelatorio resolverPorAno(FiltroRelatorioBruto filtro) {
        if (filtro.periodoInicio() != null || filtro.periodoFim() != null) {
            throw new CampoInvalidoException("periodoInicio",
                    "Relatório anual de processos usa o filtro \"ano\", não período explícito");
        }
        if (filtro.ano() == null) {
            throw new CampoInvalidoException("ano", "Ano é obrigatório para o relatório anual de processos");
        }
        int ano = filtro.ano();
        return new PeriodoRelatorio(LocalDate.of(ano, 1, 1), LocalDate.of(ano, 12, 31));
    }

    // ocupacao_baias: janela relativa a hoje (Clock), ou periodo explicito
    // quando "custom".
    private PeriodoRelatorio resolverPorJanela(FiltroRelatorioBruto filtro) {
        if (filtro.janela() == null) {
            throw new CampoInvalidoException("janela", "Janela é obrigatória para o relatório de ocupação de baias");
        }
        String janela = filtro.janela().toLowerCase(Locale.ROOT);
        LocalDate hoje = LocalDate.now(clock);
        return switch (janela) {
            case JANELA_ULTIMOS_6_MESES -> new PeriodoRelatorio(hoje.minusMonths(6), hoje);
            case JANELA_ULTIMOS_12_MESES -> new PeriodoRelatorio(hoje.minusMonths(12), hoje);
            case JANELA_CUSTOM -> resolverPorPeriodoExplicito(filtro);
            default -> throw new CampoInvalidoException("janela",
                    "Janela inválida: use ultimos_6_meses, ultimos_12_meses ou custom");
        };
    }

    private PeriodoRelatorio resolverPorPeriodoExplicito(FiltroRelatorioBruto filtro) {
        if (filtro.periodoInicio() == null || filtro.periodoFim() == null) {
            throw new CampoInvalidoException("periodoInicio", "Período (data inicial e final) é obrigatório");
        }
        if (filtro.periodoInicio().isAfter(filtro.periodoFim())) {
            throw new CampoInvalidoException("periodoFim", "Data final deve ser maior ou igual à data inicial");
        }
        return new PeriodoRelatorio(filtro.periodoInicio(), filtro.periodoFim());
    }
}
