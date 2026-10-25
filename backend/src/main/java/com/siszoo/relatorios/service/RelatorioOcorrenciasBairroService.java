package com.siszoo.relatorios.service;

import java.time.Duration;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.OptionalDouble;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.siszoo.comum.util.BlocoCsv;
import com.siszoo.ocorrencias.repository.BairroTipoProjection;
import com.siszoo.ocorrencias.repository.ContagemPorBairroProjection;
import com.siszoo.ocorrencias.repository.OcorrenciaRepository;
import com.siszoo.ocorrencias.repository.TempoAtendimentoProjection;
import com.siszoo.processos.repository.ContagemCatalogoProjection;
import com.siszoo.relatorios.dto.KpisOcorrenciasBairroResponse;
import com.siszoo.relatorios.dto.LinhaBairroOcorrenciaResponse;
import com.siszoo.relatorios.dto.PeriodoRelatorio;
import com.siszoo.relatorios.dto.RelatorioOcorrenciasBairroResponse;
import com.siszoo.relatorios.dto.TipoOcorrenciaContagemResponse;
import com.siszoo.relatorios.entity.TipoRelatorio;

// "Ocorrências por Bairro" (DER §3.6 / docs/prototipo/relatorio-ocorrencias.html).
// Exclui ocorrencias com providencia 'registro_indevido' de toda contagem,
// mesma regra ja aplicada ao KPI do dashboard (OcorrenciaRepository#contarRegistradasEm).
// "Tempo médio (h)" é registro -> encerramento (criadoEm -> encerradaEm), não
// "registro -> atendimento" como o rótulo do protótipo sugere — decisão
// validada com o usuário (horaAbertura é opcional e nem toda ocorrência passa
// por EM_ATENDIMENTO).
@Service
public class RelatorioOcorrenciasBairroService implements GeradorRelatorio<RelatorioOcorrenciasBairroResponse> {

    private static final int TOP_N_BAIRROS = 9;
    private static final String SEM_DADOS = "Diversos";

    private final OcorrenciaRepository ocorrenciaRepository;

    public RelatorioOcorrenciasBairroService(OcorrenciaRepository ocorrenciaRepository) {
        this.ocorrenciaRepository = ocorrenciaRepository;
    }

    @Override
    public TipoRelatorio tipo() {
        return TipoRelatorio.OCORRENCIAS_BAIRRO;
    }

    @Override
    @Transactional(readOnly = true)
    public RelatorioOcorrenciasBairroResponse gerarPreview(PeriodoRelatorio periodo) {
        LocalDate inicio = periodo.inicio();
        LocalDate fim = periodo.fim();

        // Uma consulta de tempos de atendimento para os KPIs e para as linhas por bairro.
        List<TempoAtendimentoProjection> tempos = ocorrenciaRepository.listarTemposDeAtendimento(inicio, fim);
        List<LinhaBairroOcorrenciaResponse> todosBairros = montarBairros(inicio, fim, tempos);
        List<LinhaBairroOcorrenciaResponse> bairrosComOutros = aplicarTopNComOutros(todosBairros);
        List<TipoOcorrenciaContagemResponse> tipos = montarTipos(inicio, fim);
        KpisOcorrenciasBairroResponse kpis = calcularKpis(inicio, fim, tempos);
        String nota = montarNotaFocoGeografico(todosBairros, kpis.ocorrenciasRegistradas());

        return new RelatorioOcorrenciasBairroResponse(inicio, fim, kpis, bairrosComOutros, tipos, nota);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BlocoCsv> blocosCsv(PeriodoRelatorio periodo) {
        LocalDate inicio = periodo.inicio();
        LocalDate fim = periodo.fim();

        // CSV exporta a lista COMPLETA de bairros, sem a agregacao "Outros" do preview/PDF.
        List<List<String>> linhasBairros = montarBairros(inicio, fim, ocorrenciaRepository.listarTemposDeAtendimento(inicio, fim)).stream()
                .map(l -> List.of(l.bairro(), String.valueOf(l.ocorrencias()), l.tipoPredominante(),
                        l.tempoMedioHoras() != null ? formatarComVirgula(l.tempoMedioHoras()) : "—"))
                .toList();

        List<List<String>> linhasTipos = montarTipos(inicio, fim).stream()
                .map(l -> List.of(l.tipo(), String.valueOf(l.quantidade())))
                .toList();

        return List.of(
                new BlocoCsv("Bairros com mais ocorrências",
                        List.of("Bairro", "Ocorrências", "Tipo predominante", "Tempo médio (h)"), linhasBairros),
                new BlocoCsv("Tipos de ocorrência", List.of("Tipo", "Quantidade"), linhasTipos));
    }

    private KpisOcorrenciasBairroResponse calcularKpis(
            LocalDate inicio, LocalDate fim, List<TempoAtendimentoProjection> tempos) {
        long registradas = ocorrenciaRepository.contarRegistradasNoPeriodo(inicio, fim);
        long bairrosAtingidos = ocorrenciaRepository.contarBairrosAtingidos(inicio, fim);
        long encerradas = ocorrenciaRepository.contarEncerradasNoPeriodo(inicio, fim);
        int percentualEncerradas = registradas == 0 ? 0 : (int) Math.round(encerradas * 100.0 / registradas);

        List<Double> todasAsHoras = tempos.stream()
                .map(this::horasEntre)
                .toList();
        Double tempoMedio = media(todasAsHoras);

        return new KpisOcorrenciasBairroResponse(registradas, bairrosAtingidos, tempoMedio, encerradas, percentualEncerradas);
    }

    private List<LinhaBairroOcorrenciaResponse> montarBairros(
            LocalDate inicio, LocalDate fim, List<TempoAtendimentoProjection> tempos) {
        List<ContagemPorBairroProjection> contagens = ocorrenciaRepository.contarPorBairro(inicio, fim);
        if (contagens.isEmpty()) {
            return List.of();
        }

        Map<String, Map<String, Long>> tipoPorBairro = new HashMap<>();
        for (BairroTipoProjection linha : ocorrenciaRepository.contarPorBairroETipo(inicio, fim)) {
            tipoPorBairro.computeIfAbsent(linha.getBairro(), k -> new HashMap<>()).merge(linha.getTipo(), linha.getQuantidade(), Long::sum);
        }

        Map<String, List<Double>> horasPorBairro = new HashMap<>();
        for (TempoAtendimentoProjection linha : tempos) {
            horasPorBairro.computeIfAbsent(linha.getBairro(), k -> new ArrayList<>()).add(horasEntre(linha));
        }

        return contagens.stream()
                .map(c -> new LinhaBairroOcorrenciaResponse(
                        c.getBairro(), c.getQuantidade(), tipoPredominante(tipoPorBairro.get(c.getBairro())),
                        media(horasPorBairro.get(c.getBairro()))))
                .toList();
    }

    // Top N (ordem ja vem desc do repository) + 1 linha agregada "Outros (N
    // bairros)" com o restante — mesmo padrao das demais listas longas.
    private List<LinhaBairroOcorrenciaResponse> aplicarTopNComOutros(List<LinhaBairroOcorrenciaResponse> todos) {
        if (todos.size() <= TOP_N_BAIRROS) {
            return todos;
        }
        List<LinhaBairroOcorrenciaResponse> top = todos.subList(0, TOP_N_BAIRROS);
        List<LinhaBairroOcorrenciaResponse> resto = todos.subList(TOP_N_BAIRROS, todos.size());

        long ocorrenciasRestantes = resto.stream().mapToLong(LinhaBairroOcorrenciaResponse::ocorrencias).sum();
        List<Double> horasRestantes = resto.stream()
                .map(LinhaBairroOcorrenciaResponse::tempoMedioHoras)
                .filter(h -> h != null)
                .toList();

        List<LinhaBairroOcorrenciaResponse> resultado = new ArrayList<>(top);
        resultado.add(new LinhaBairroOcorrenciaResponse(
                "Outros (" + resto.size() + " bairros)", ocorrenciasRestantes, SEM_DADOS, media(horasRestantes)));
        return resultado;
    }

    private List<TipoOcorrenciaContagemResponse> montarTipos(LocalDate inicio, LocalDate fim) {
        return ocorrenciaRepository.contarPorTipo(inicio, fim).stream()
                .map((ContagemCatalogoProjection linha) -> new TipoOcorrenciaContagemResponse(linha.getNome(), linha.getQuantidade()))
                .toList();
    }

    private String montarNotaFocoGeografico(List<LinhaBairroOcorrenciaResponse> bairros, long totalOcorrencias) {
        if (bairros.isEmpty() || totalOcorrencias == 0) {
            return "Sem ocorrências registradas no período selecionado.";
        }
        LinhaBairroOcorrenciaResponse topBairro = bairros.get(0);
        double percentual = Math.round(topBairro.ocorrencias() * 1000.0 / totalOcorrencias) / 10.0;
        return "O bairro " + topBairro.bairro() + " concentra " + formatarComVirgula(percentual)
                + "% das ocorrências, principalmente relacionadas à " + topBairro.tipoPredominante() + ".";
    }

    private String tipoPredominante(Map<String, Long> contagemPorTipo) {
        if (contagemPorTipo == null || contagemPorTipo.isEmpty()) {
            return SEM_DADOS;
        }
        return contagemPorTipo.entrySet().stream()
                .max(Comparator.comparingLong(Map.Entry::getValue))
                .map(Map.Entry::getKey)
                .orElse(SEM_DADOS);
    }

    private double horasEntre(TempoAtendimentoProjection linha) {
        return Duration.between(linha.getCriadoEm(), linha.getEncerradaEm()).toMinutes() / 60.0;
    }

    private Double media(List<Double> valores) {
        if (valores == null || valores.isEmpty()) {
            return null;
        }
        OptionalDouble media = valores.stream().mapToDouble(Double::doubleValue).average();
        return media.isPresent() ? Math.round(media.getAsDouble() * 10.0) / 10.0 : null;
    }

    // "3.4" -> "3,4" (separador decimal PT-BR, DER regra de formatacao).
    private String formatarComVirgula(double valor) {
        return String.valueOf(valor).replace('.', ',');
    }
}
