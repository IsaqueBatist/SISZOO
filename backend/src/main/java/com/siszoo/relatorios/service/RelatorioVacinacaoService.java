package com.siszoo.relatorios.service;

import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.siszoo.animais.clinico.entity.Vacinacao;
import com.siszoo.animais.clinico.repository.VacinacaoRepository;
import com.siszoo.animais.entity.StatusAnimal;
import com.siszoo.animais.repository.AnimalRepository;
import com.siszoo.comum.repository.ContagemCatalogoProjection;
import com.siszoo.comum.util.BlocoCsv;
import com.siszoo.relatorios.dto.AnimalVacinaVencidaResponse;
import com.siszoo.relatorios.dto.AplicacaoPorVacinaResponse;
import com.siszoo.relatorios.dto.AplicacaoPorVeterinarioResponse;
import com.siszoo.relatorios.dto.KpisVacinacaoResponse;
import com.siszoo.relatorios.dto.PeriodoRelatorio;
import com.siszoo.relatorios.dto.RelatorioVacinacaoResponse;
import com.siszoo.relatorios.entity.TipoRelatorio;

// "Relatório de Vacinação" (DER §3.6, regra 22 / docs/prototipo/relatorio-vacinacao.html).
// "Vacinas aplicadas" e "Aplicações por..." sao contagem de ATIVIDADE no
// periodo filtrado (todo evento, mesmo um depois retificado); "% Animais
// vacinados", "Vencidas" e "A vencer em 30 dias" sao o estado de vigencia
// ATUAL (snapshot de hoje via Clock), igual ao KPI do dashboard — o periodo da
// tela so filtra as secoes de atividade, nao a vigencia (nao ha como filtrar
// "vigencia como estava em uma data passada" sem historico de snapshot).
// IMPORTANTE: 30 dias aqui, nao os 7 do alerta do sistema (DER regra 22 e
// deliberadamente diferente de CLAUDE.md "alerta de reforço: 7 dias").
@Service
public class RelatorioVacinacaoService implements GeradorRelatorio<RelatorioVacinacaoResponse> {

    private static final int DIAS_A_VENCER = 30;
    private static final int TOP_N_VENCIDAS = 10;

    private final VacinacaoRepository vacinacaoRepository;
    private final AnimalRepository animalRepository;
    private final Clock clock;

    public RelatorioVacinacaoService(
            VacinacaoRepository vacinacaoRepository, AnimalRepository animalRepository, Clock clock) {
        this.vacinacaoRepository = vacinacaoRepository;
        this.animalRepository = animalRepository;
        this.clock = clock;
    }

    @Override
    public TipoRelatorio tipo() {
        return TipoRelatorio.VACINACAO;
    }

    @Override
    @Transactional(readOnly = true)
    public RelatorioVacinacaoResponse gerarPreview(PeriodoRelatorio periodo) {
        LocalDate hoje = LocalDate.now(clock);
        List<Vacinacao> vigentes = vacinacaoRepository.findVigentesParaAlertaVacinal(StatusAnimal.CODIGOS_FORA_DA_CUSTODIA);
        long totalSobCustodia = animalRepository.countByStatus_CodigoNotIn(StatusAnimal.CODIGOS_FORA_DA_CUSTODIA);

        KpisVacinacaoResponse kpis = calcularKpis(periodo, hoje, vigentes, totalSobCustodia);
        List<AplicacaoPorVacinaResponse> porVacina = montarPorVacina(periodo, hoje, vigentes, totalSobCustodia);
        List<AplicacaoPorVeterinarioResponse> porVeterinario = montarPorVeterinario(periodo);

        List<AnimalVacinaVencidaResponse> vencidas = montarVencidas(vigentes, hoje);
        List<AnimalVacinaVencidaResponse> topVencidas = vencidas.stream().limit(TOP_N_VENCIDAS).toList();
        long excedente = Math.max(0, vencidas.size() - TOP_N_VENCIDAS);

        return new RelatorioVacinacaoResponse(
                periodo.inicio(), periodo.fim(), kpis, porVacina, porVeterinario, topVencidas, excedente);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BlocoCsv> blocosCsv(PeriodoRelatorio periodo) {
        LocalDate hoje = LocalDate.now(clock);
        List<Vacinacao> vigentes = vacinacaoRepository.findVigentesParaAlertaVacinal(StatusAnimal.CODIGOS_FORA_DA_CUSTODIA);
        long totalSobCustodia = animalRepository.countByStatus_CodigoNotIn(StatusAnimal.CODIGOS_FORA_DA_CUSTODIA);

        List<List<String>> linhasPorVacina = montarPorVacina(periodo, hoje, vigentes, totalSobCustodia).stream()
                .map(l -> List.of(l.vacina(), String.valueOf(l.aplicacoes()),
                        l.coberturaAtualPercentual() + "%", String.valueOf(l.vencendoEm30Dias())))
                .toList();

        List<List<String>> linhasPorVeterinario = montarPorVeterinario(periodo).stream()
                .map(l -> List.of(l.veterinario(), String.valueOf(l.aplicacoes())))
                .toList();

        // CSV exporta a lista COMPLETA de animais com vacina vencida, sem o
        // corte de top N do preview/PDF (decisao validada com o usuario).
        // List.of recusa elemento nulo — microchip/baia podem ser null.
        List<List<String>> linhasVencidas = montarVencidas(vigentes, hoje).stream()
                .map(l -> List.of(l.animal(), valorOuTraco(l.microchip()), valorOuTraco(l.baia()), l.vacina(),
                        String.valueOf(l.diasAtraso())))
                .toList();

        return List.of(
                new BlocoCsv("Aplicações por Vacina",
                        List.of("Vacina", "Aplicações", "Cobertura atual", "Vencendo em 30 dias"), linhasPorVacina),
                new BlocoCsv("Aplicações por Veterinário", List.of("Veterinário", "Aplicações"), linhasPorVeterinario),
                new BlocoCsv("Animais com Vacinas Vencidas",
                        List.of("Animal", "Microchip", "Baia", "Vacina vencida", "Dias de atraso"), linhasVencidas));
    }

    private KpisVacinacaoResponse calcularKpis(
            PeriodoRelatorio periodo, LocalDate hoje, List<Vacinacao> vigentes, long totalSobCustodia) {
        long vacinasAplicadas = vacinacaoRepository.countByDataAplicacaoBetween(periodo.inicio(), periodo.fim());

        long animaisVacinados = vigentes.stream()
                .filter(v -> !v.calcularDataValidade().isBefore(hoje))
                .map(v -> v.getAnimal().getId())
                .distinct()
                .count();
        int percentual = totalSobCustodia == 0 ? 0 : (int) Math.round(animaisVacinados * 100.0 / totalSobCustodia);

        long vencidas = vigentes.stream().filter(v -> v.calcularDataValidade().isBefore(hoje)).count();
        long aVencer = vigentes.stream()
                .filter(v -> {
                    LocalDate validade = v.calcularDataValidade();
                    return !validade.isBefore(hoje) && !validade.isAfter(hoje.plusDays(DIAS_A_VENCER));
                })
                .count();

        return new KpisVacinacaoResponse(vacinasAplicadas, percentual, animaisVacinados, totalSobCustodia, vencidas, aVencer);
    }

    private List<AplicacaoPorVacinaResponse> montarPorVacina(
            PeriodoRelatorio periodo, LocalDate hoje, List<Vacinacao> vigentes, long totalSobCustodia) {
        Map<String, Long> aplicacoesPorVacina = vacinacaoRepository
                .contarAplicacoesPorVacina(periodo.inicio(), periodo.fim()).stream()
                .collect(Collectors.toMap(ContagemCatalogoProjection::getNome, ContagemCatalogoProjection::getQuantidade));

        Map<String, List<Vacinacao>> vigentesPorVacina = vigentes.stream()
                .collect(Collectors.groupingBy(v -> v.getVacina().getNome()));

        return aplicacoesPorVacina.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .map(entry -> {
                    List<Vacinacao> dessaVacina = vigentesPorVacina.getOrDefault(entry.getKey(), List.of());
                    long cobertura = dessaVacina.stream().filter(v -> !v.calcularDataValidade().isBefore(hoje)).count();
                    long vencendo = dessaVacina.stream()
                            .filter(v -> {
                                LocalDate validade = v.calcularDataValidade();
                                return !validade.isBefore(hoje) && !validade.isAfter(hoje.plusDays(DIAS_A_VENCER));
                            })
                            .count();
                    int coberturaPercentual = totalSobCustodia == 0 ? 0 : (int) Math.round(cobertura * 100.0 / totalSobCustodia);
                    return new AplicacaoPorVacinaResponse(entry.getKey(), entry.getValue(), coberturaPercentual, vencendo);
                })
                .toList();
    }

    private List<AplicacaoPorVeterinarioResponse> montarPorVeterinario(PeriodoRelatorio periodo) {
        return vacinacaoRepository.contarAplicacoesPorVeterinario(periodo.inicio(), periodo.fim()).stream()
                .map(p -> new AplicacaoPorVeterinarioResponse(p.getNome(), p.getQuantidade()))
                .toList();
    }

    // Maior atraso primeiro — mesma ordem do protótipo (Pingo/42d no topo).
    private List<AnimalVacinaVencidaResponse> montarVencidas(List<Vacinacao> vigentes, LocalDate hoje) {
        List<AnimalVacinaVencidaResponse> vencidas = new ArrayList<>();
        for (Vacinacao v : vigentes) {
            LocalDate validade = v.calcularDataValidade();
            if (validade.isBefore(hoje)) {
                String baia = v.getAnimal().getBaia() != null ? v.getAnimal().getBaia().getNome() : null;
                long diasAtraso = java.time.temporal.ChronoUnit.DAYS.between(validade, hoje);
                vencidas.add(new AnimalVacinaVencidaResponse(
                        v.getAnimal().getNome(), v.getAnimal().getMicrochip(), baia, v.getVacina().getNome(), diasAtraso));
            }
        }
        return vencidas.stream().sorted(Comparator.comparingLong(AnimalVacinaVencidaResponse::diasAtraso).reversed()).toList();
    }

    private String valorOuTraco(String valor) {
        return valor != null ? valor : "—";
    }
}
