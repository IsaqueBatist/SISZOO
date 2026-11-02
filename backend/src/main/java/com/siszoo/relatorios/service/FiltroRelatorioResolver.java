package com.siszoo.relatorios.service;

import java.time.Clock;
import java.time.LocalDate;

import org.springframework.stereotype.Service;

import com.siszoo.comum.exception.CampoInvalidoException;
import com.siszoo.relatorios.dto.FiltroRelatorioBruto;
import com.siszoo.relatorios.dto.PeriodoRelatorio;
import com.siszoo.relatorios.entity.TipoRelatorio;

@Service
public class FiltroRelatorioResolver {

    private final Clock clock;

    public FiltroRelatorioResolver(Clock clock) {
        this.clock = clock;
    }

    public TipoRelatorio tipoPorCodigo(String codigo) {
        try {
            return TipoRelatorio.deCodigo(codigo);
        } catch (IllegalArgumentException ex) {
            throw new CampoInvalidoException("tipo", "Tipo de relatório inválido. Selecione um da lista.");
        }
    }

    public PeriodoRelatorio resolver(FiltroRelatorioBruto filtro) {
        if (filtro.tipo() == null) {
            throw new CampoInvalidoException("tipo", "Selecione o tipo de relatório.");
        }
        return switch (filtro.tipo()) {
            case ANUAL_PROCESSOS -> resolverPorAno(filtro);
            case ADOCOES, OCUPACAO_BAIAS -> posicaoDeHoje();
            case VACINACAO, PROCEDIMENTOS, OCORRENCIAS_BAIRRO -> resolverPorPeriodoExplicito(filtro);
        };
    }

    private PeriodoRelatorio resolverPorAno(FiltroRelatorioBruto filtro) {
        if (filtro.periodoInicio() != null || filtro.periodoFim() != null) {
            throw new CampoInvalidoException("periodoInicio",
                    "O relatório anual de processos é gerado por ano, não por período.");
        }
        if (filtro.ano() == null) {
            throw new CampoInvalidoException("ano", "Informe o ano do relatório anual de processos.");
        }
        int ano = filtro.ano();
        return new PeriodoRelatorio(LocalDate.of(ano, 1, 1), LocalDate.of(ano, 12, 31));
    }

    private PeriodoRelatorio posicaoDeHoje() {
        LocalDate hoje = LocalDate.now(clock);
        return new PeriodoRelatorio(hoje, hoje);
    }

    private PeriodoRelatorio resolverPorPeriodoExplicito(FiltroRelatorioBruto filtro) {
        if (filtro.periodoInicio() == null || filtro.periodoFim() == null) {
            throw new CampoInvalidoException("periodoInicio", "Informe a data inicial e a data final do período.");
        }
        if (filtro.periodoInicio().isAfter(filtro.periodoFim())) {
            throw new CampoInvalidoException("periodoFim", "A data final deve ser maior ou igual à data inicial.");
        }
        return new PeriodoRelatorio(filtro.periodoInicio(), filtro.periodoFim());
    }
}
