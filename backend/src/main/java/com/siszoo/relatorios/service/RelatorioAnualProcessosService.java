package com.siszoo.relatorios.service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.OptionalDouble;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.siszoo.comum.util.BlocoCsv;
import com.siszoo.processos.repository.AnimalAmostradoRepository;
import com.siszoo.processos.repository.BairroDoencaProjection;
import com.siszoo.processos.repository.BairroProcessoProjection;
import com.siszoo.processos.repository.ContagemCatalogoProjection;
import com.siszoo.processos.repository.ProcessoSanitarioRepository;
import com.siszoo.processos.repository.ResultadosLaboratoriaisProjection;
import com.siszoo.processos.repository.TempoResolucaoPorLaboratorioProjection;
import com.siszoo.processos.repository.TempoResolucaoProjection;
import com.siszoo.relatorios.dto.BairroProcessoResponse;
import com.siszoo.relatorios.dto.CasoPorPatologiaResponse;
import com.siszoo.relatorios.dto.DistribuicaoEspecieResponse;
import com.siszoo.relatorios.dto.KpisAnualProcessosResponse;
import com.siszoo.relatorios.dto.LaboratorioUtilizadoResponse;
import com.siszoo.relatorios.dto.PeriodoRelatorio;
import com.siszoo.relatorios.dto.RelatorioAnualProcessosResponse;
import com.siszoo.relatorios.dto.ResultadoLaboratorialPorDoencaResponse;
import com.siszoo.relatorios.entity.TipoRelatorio;

// "Relatório Anual de Processos Sanitários" (DER §3.6 / docs/prototipo/relatorio-anual.html).
// Universo sempre "processos ABERTOS no ano" (dataAbertura), nao "resultados
// lancados no ano" como os graficos do dashboard (DashboardService) — so
// contarPorDoenca(ano) tem exatamente o mesmo escopo e e reaproveitado; as
// demais secoes usam queries novas (ver ProcessoSanitarioRepository/AnimalAmostradoRepository).
// "Tempo médio (dias)" de "Laboratórios utilizados" e proxy (dataAbertura ->
// dataResultado, nao envio->retorno de amostra — campo nunca preenchido) e a
// secao "Bairros" so considera processos com ocorrencia vinculada (o vinculo
// e opcional) — ambas decisoes validadas com o usuario. Sem secao de
// assinatura/recomendacao (regras 20/21 do DER) e sem comparacao com ano
// anterior/benchmarks externos (dado que o prototipo usa mas o sistema nao tem).
@Service
public class RelatorioAnualProcessosService implements GeradorRelatorio<RelatorioAnualProcessosResponse> {

    private static final int TOP_N_BAIRROS = 9;
    private static final String SEM_OCORRENCIA_VINCULADA = "Sem ocorrência vinculada";

    private final ProcessoSanitarioRepository processoSanitarioRepository;
    private final AnimalAmostradoRepository animalAmostradoRepository;

    public RelatorioAnualProcessosService(
            ProcessoSanitarioRepository processoSanitarioRepository, AnimalAmostradoRepository animalAmostradoRepository) {
        this.processoSanitarioRepository = processoSanitarioRepository;
        this.animalAmostradoRepository = animalAmostradoRepository;
    }

    @Override
    public TipoRelatorio tipo() {
        return TipoRelatorio.ANUAL_PROCESSOS;
    }

    @Override
    @Transactional(readOnly = true)
    public RelatorioAnualProcessosResponse gerarPreview(PeriodoRelatorio periodo) {
        LocalDate inicio = periodo.inicio();
        LocalDate fim = periodo.fim();
        int ano = inicio.getYear();

        KpisAnualProcessosResponse kpis = calcularKpis(inicio, fim);
        List<CasoPorPatologiaResponse> porPatologia = montarPorPatologia(ano);
        List<ResultadoLaboratorialPorDoencaResponse> resultadosPorDoenca = montarResultadosPorDoenca(inicio, fim);
        ResultadoLaboratorialPorDoencaResponse totalResultados = somarResultados(resultadosPorDoenca);
        List<DistribuicaoEspecieResponse> porEspecie = montarPorEspecie(inicio, fim);
        List<BairroProcessoResponse> bairros = montarBairrosComAgregados(inicio, fim);
        List<LaboratorioUtilizadoResponse> laboratorios = montarLaboratorios(inicio, fim);
        String sumario = montarSumarioExecutivo(ano, kpis);

        return new RelatorioAnualProcessosResponse(
                ano, inicio, fim, kpis, sumario, porPatologia, resultadosPorDoenca, totalResultados, porEspecie,
                bairros, laboratorios);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BlocoCsv> blocosCsv(PeriodoRelatorio periodo) {
        LocalDate inicio = periodo.inicio();
        LocalDate fim = periodo.fim();
        int ano = inicio.getYear();

        List<List<String>> linhasPatologia = montarPorPatologia(ano).stream()
                .map(l -> List.of(l.doenca(), String.valueOf(l.quantidade())))
                .toList();

        List<ResultadoLaboratorialPorDoencaResponse> resultados = montarResultadosPorDoenca(inicio, fim);
        List<List<String>> linhasResultados = new ArrayList<>(resultados.stream()
                .map(l -> List.of(l.doenca(), String.valueOf(l.investigados()), String.valueOf(l.positivos()),
                        String.valueOf(l.negativos()), String.valueOf(l.inconclusivos()), String.valueOf(l.aguardando()),
                        l.percentualPositividade() + "%"))
                .toList());
        ResultadoLaboratorialPorDoencaResponse totalResultados = somarResultados(resultados);
        linhasResultados.add(List.of("TOTAL", String.valueOf(totalResultados.investigados()),
                String.valueOf(totalResultados.positivos()), String.valueOf(totalResultados.negativos()),
                String.valueOf(totalResultados.inconclusivos()), String.valueOf(totalResultados.aguardando()),
                totalResultados.percentualPositividade() + "%"));

        List<List<String>> linhasEspecie = montarPorEspecie(inicio, fim).stream()
                .map(l -> List.of(l.especie(), String.valueOf(l.quantidade()), l.percentual() + "%"))
                .toList();

        // CSV exporta todos os bairros (sem o top 9 + Outros do preview/PDF),
        // mas mantem a linha "Sem ocorrência vinculada" quando ha processos assim.
        List<List<String>> linhasBairros = montarBairrosCompleto(inicio, fim).stream()
                .map(l -> List.of(l.bairro(), String.valueOf(l.processos()), String.valueOf(l.positivos()), l.doencasPredominantes()))
                .toList();

        List<List<String>> linhasLaboratorios = montarLaboratorios(inicio, fim).stream()
                .map(l -> List.of(l.laboratorio(), String.valueOf(l.amostras()), l.percentualDoTotal() + "%",
                        l.tempoMedioDias() != null ? String.valueOf(l.tempoMedioDias()) : "—"))
                .toList();

        return List.of(
                new BlocoCsv("Distribuição por Patologia", List.of("Doença", "Quantidade"), linhasPatologia),
                new BlocoCsv("Resultados Laboratoriais",
                        List.of("Doença", "Investigados", "Positivos", "Negativos", "Inconclus.", "Aguard.", "Positividade"),
                        linhasResultados),
                new BlocoCsv("Distribuição por Espécie", List.of("Espécie", "Quantidade", "% do total"), linhasEspecie),
                new BlocoCsv("Bairros com mais ocorrências",
                        List.of("Bairro", "Processos", "Positivos", "Doenças predominantes"), linhasBairros),
                new BlocoCsv("Laboratórios utilizados",
                        List.of("Laboratório", "Amostras", "% do total", "Tempo médio (dias)"), linhasLaboratorios));
    }

    private KpisAnualProcessosResponse calcularKpis(LocalDate inicio, LocalDate fim) {
        long processosAbertos = processoSanitarioRepository.countByDataAberturaBetween(inicio, fim);
        long confirmadosPositivos = processoSanitarioRepository
                .countByDataAberturaBetweenAndResultadoLaboratorial_Codigo(inicio, fim, "positivo");
        int percentualPositividade = processosAbertos == 0 ? 0 : (int) Math.round(confirmadosPositivos * 100.0 / processosAbertos);
        long comContatoHumano = animalAmostradoRepository.contarProcessosComContatoHumano(inicio, fim);

        List<Double> dias = processoSanitarioRepository.listarTemposDeResolucao(inicio, fim).stream()
                .map(this::diasEntre)
                .toList();
        Double tempoMedioDias = media(dias);

        return new KpisAnualProcessosResponse(processosAbertos, confirmadosPositivos, percentualPositividade, comContatoHumano, tempoMedioDias);
    }

    private List<CasoPorPatologiaResponse> montarPorPatologia(int ano) {
        return processoSanitarioRepository.contarPorDoenca(ano).stream()
                .map(l -> new CasoPorPatologiaResponse(l.getNome(), l.getQuantidade()))
                .sorted(Comparator.comparingLong(CasoPorPatologiaResponse::quantidade).reversed())
                .toList();
    }

    private List<ResultadoLaboratorialPorDoencaResponse> montarResultadosPorDoenca(LocalDate inicio, LocalDate fim) {
        return processoSanitarioRepository.contarResultadosDetalhadoPorDoenca(inicio, fim).stream()
                .map(this::paraResultadoResponse)
                .toList();
    }

    private ResultadoLaboratorialPorDoencaResponse paraResultadoResponse(ResultadosLaboratoriaisProjection linha) {
        int percentual = linha.getInvestigados() == 0 ? 0 : (int) Math.round(linha.getPositivos() * 100.0 / linha.getInvestigados());
        return new ResultadoLaboratorialPorDoencaResponse(
                linha.getNome(), linha.getInvestigados(), linha.getPositivos(), linha.getNegativos(),
                linha.getInconclusivos(), linha.getAguardando(), percentual);
    }

    private ResultadoLaboratorialPorDoencaResponse somarResultados(List<ResultadoLaboratorialPorDoencaResponse> linhas) {
        long investigados = linhas.stream().mapToLong(ResultadoLaboratorialPorDoencaResponse::investigados).sum();
        long positivos = linhas.stream().mapToLong(ResultadoLaboratorialPorDoencaResponse::positivos).sum();
        long negativos = linhas.stream().mapToLong(ResultadoLaboratorialPorDoencaResponse::negativos).sum();
        long inconclusivos = linhas.stream().mapToLong(ResultadoLaboratorialPorDoencaResponse::inconclusivos).sum();
        long aguardando = linhas.stream().mapToLong(ResultadoLaboratorialPorDoencaResponse::aguardando).sum();
        int percentual = investigados == 0 ? 0 : (int) Math.round(positivos * 100.0 / investigados);
        return new ResultadoLaboratorialPorDoencaResponse("TOTAL", investigados, positivos, negativos, inconclusivos, aguardando, percentual);
    }

    private List<DistribuicaoEspecieResponse> montarPorEspecie(LocalDate inicio, LocalDate fim) {
        List<ContagemCatalogoProjection> linhas = animalAmostradoRepository.contarPorEspecieNoPeriodo(inicio, fim);
        long total = linhas.stream().mapToLong(ContagemCatalogoProjection::getQuantidade).sum();
        return linhas.stream()
                .map(l -> new DistribuicaoEspecieResponse(l.getNome(), l.getQuantidade(),
                        total == 0 ? 0 : (int) Math.round(l.getQuantidade() * 100.0 / total)))
                .sorted(Comparator.comparingLong(DistribuicaoEspecieResponse::quantidade).reversed())
                .toList();
    }

    // Lista completa de bairros com processos vinculados (sem top N, sem "Sem
    // ocorrência vinculada") — usada tanto pelo CSV quanto como base do preview.
    private List<BairroProcessoResponse> montarBairrosCompleto(LocalDate inicio, LocalDate fim) {
        List<BairroProcessoProjection> contagens = processoSanitarioRepository.contarPorBairro(inicio, fim);

        Map<String, List<Map.Entry<String, Long>>> doencasPorBairro = new HashMap<>();
        for (BairroDoencaProjection linha : processoSanitarioRepository.contarPorBairroEDoenca(inicio, fim)) {
            doencasPorBairro.computeIfAbsent(linha.getBairro(), k -> new ArrayList<>())
                    .add(Map.entry(linha.getDoenca(), linha.getQuantidade()));
        }

        List<BairroProcessoResponse> resultado = contagens.stream()
                .map(c -> new BairroProcessoResponse(
                        c.getBairro(), c.getProcessos(), c.getPositivos(), doencasPredominantes(doencasPorBairro.get(c.getBairro()))))
                .collect(java.util.stream.Collectors.toCollection(ArrayList::new));

        long semOcorrencia = processoSanitarioRepository.countByOcorrenciaIsNullAndDataAberturaBetween(inicio, fim);
        if (semOcorrencia > 0) {
            resultado.add(new BairroProcessoResponse(SEM_OCORRENCIA_VINCULADA, semOcorrencia, 0, "—"));
        }
        return resultado;
    }

    // Preview/PDF: top 9 bairros COM ocorrência (a linha "Sem ocorrência
    // vinculada" fica sempre por fora da contagem do top N e vai ao final).
    private List<BairroProcessoResponse> montarBairrosComAgregados(LocalDate inicio, LocalDate fim) {
        List<BairroProcessoProjection> contagens = processoSanitarioRepository.contarPorBairro(inicio, fim);
        Map<String, List<Map.Entry<String, Long>>> doencasPorBairro = new HashMap<>();
        for (BairroDoencaProjection linha : processoSanitarioRepository.contarPorBairroEDoenca(inicio, fim)) {
            doencasPorBairro.computeIfAbsent(linha.getBairro(), k -> new ArrayList<>())
                    .add(Map.entry(linha.getDoenca(), linha.getQuantidade()));
        }
        List<BairroProcessoResponse> todos = contagens.stream()
                .map(c -> new BairroProcessoResponse(
                        c.getBairro(), c.getProcessos(), c.getPositivos(), doencasPredominantes(doencasPorBairro.get(c.getBairro()))))
                .toList();

        List<BairroProcessoResponse> resultado = new ArrayList<>();
        if (todos.size() <= TOP_N_BAIRROS) {
            resultado.addAll(todos);
        } else {
            resultado.addAll(todos.subList(0, TOP_N_BAIRROS));
            List<BairroProcessoResponse> resto = todos.subList(TOP_N_BAIRROS, todos.size());
            long processosRestantes = resto.stream().mapToLong(BairroProcessoResponse::processos).sum();
            long positivosRestantes = resto.stream().mapToLong(BairroProcessoResponse::positivos).sum();
            resultado.add(new BairroProcessoResponse(
                    "Outros (" + resto.size() + " bairros)", processosRestantes, positivosRestantes, "Diversos"));
        }

        long semOcorrencia = processoSanitarioRepository.countByOcorrenciaIsNullAndDataAberturaBetween(inicio, fim);
        if (semOcorrencia > 0) {
            resultado.add(new BairroProcessoResponse(SEM_OCORRENCIA_VINCULADA, semOcorrencia, 0, "—"));
        }
        return resultado;
    }

    private String doencasPredominantes(List<Map.Entry<String, Long>> doencas) {
        if (doencas == null || doencas.isEmpty()) {
            return "—";
        }
        return doencas.stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(2)
                .map(Map.Entry::getKey)
                .reduce((a, b) -> a + " · " + b)
                .orElse("—");
    }

    private List<LaboratorioUtilizadoResponse> montarLaboratorios(LocalDate inicio, LocalDate fim) {
        List<ContagemCatalogoProjection> amostrasPorLab = animalAmostradoRepository.contarAmostrasPorLaboratorio(inicio, fim);
        long totalAmostras = amostrasPorLab.stream().mapToLong(ContagemCatalogoProjection::getQuantidade).sum();

        Map<String, List<Double>> diasPorLab = new HashMap<>();
        for (TempoResolucaoPorLaboratorioProjection linha : processoSanitarioRepository.listarTemposDeResolucaoPorLaboratorio(inicio, fim)) {
            diasPorLab.computeIfAbsent(linha.getLaboratorioCodigo(), k -> new ArrayList<>())
                    .add((double) ChronoUnit.DAYS.between(linha.getDataAbertura(), linha.getDataResultado()));
        }

        return amostrasPorLab.stream()
                .map(l -> new LaboratorioUtilizadoResponse(
                        l.getNome(), l.getQuantidade(),
                        totalAmostras == 0 ? 0 : (int) Math.round(l.getQuantidade() * 100.0 / totalAmostras),
                        media(diasPorLab.get(l.getCodigo()))))
                .sorted(Comparator.comparingLong(LaboratorioUtilizadoResponse::amostras).reversed())
                .toList();
    }

    private String montarSumarioExecutivo(int ano, KpisAnualProcessosResponse kpis) {
        String tempoMedio = kpis.tempoMedioDias() != null ? String.valueOf(Math.round(kpis.tempoMedioDias())) : "—";
        return "Durante o exercício de " + ano + ", o Centro de Controle de Zoonoses de Itu instaurou "
                + kpis.processosAbertos() + " processo(s) sanitário(s), com " + kpis.percentualPositividade()
                + "% de positividade laboratorial e tempo médio de " + tempoMedio
                + " dia(s) entre a abertura do processo e o registro do resultado.";
    }

    private double diasEntre(TempoResolucaoProjection linha) {
        return ChronoUnit.DAYS.between(linha.getDataAbertura(), linha.getDataResultado());
    }

    private Double media(List<Double> valores) {
        if (valores == null || valores.isEmpty()) {
            return null;
        }
        OptionalDouble media = valores.stream().mapToDouble(Double::doubleValue).average();
        return media.isPresent() ? Math.round(media.getAsDouble() * 10.0) / 10.0 : null;
    }
}
