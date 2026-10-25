package com.siszoo.relatorios.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.siszoo.animais.clinico.entity.Procedimento;
import com.siszoo.animais.clinico.repository.AplicacaoPorVeterinarioProjection;
import com.siszoo.animais.clinico.repository.PrescricaoRepository;
import com.siszoo.animais.clinico.repository.ProcedimentoRepository;
import com.siszoo.animais.clinico.repository.ProdutividadeProcedimentoProjection;
import com.siszoo.animais.clinico.repository.VacinacaoRepository;
import com.siszoo.comum.util.BlocoCsv;
import com.siszoo.comum.util.Formatadores;
import com.siszoo.processos.repository.ContagemCatalogoProjection;
import com.siszoo.relatorios.dto.CirurgiaRealizadaResponse;
import com.siszoo.relatorios.dto.KpisProcedimentosResponse;
import com.siszoo.relatorios.dto.PeriodoRelatorio;
import com.siszoo.relatorios.dto.ProcedimentoPorTipoResponse;
import com.siszoo.relatorios.dto.ProdutividadeVeterinarioResponse;
import com.siszoo.relatorios.dto.RelatorioProcedimentosResponse;
import com.siszoo.relatorios.entity.TipoRelatorio;

// "Relatório de Procedimentos" (DER §3.6 / docs/prototipo/relatorio-procedimentos.html).
// "Procedimentos" aqui e um conceito amplo (igual ao bar chart do prototipo:
// Vacinações + Atendimentos clínicos + Castrações + Medicações + Cirurgias
// maiores = Total), nao so a tabela `procedimento` — Vacinações vem de
// Vacinacao e Medicações vem de Prescricao, fontes separadas na modelagem
// clinica (ver RelatorioVacinacaoService, mesmo padrao de "atividade no
// periodo" por dataAplicacao/dataInicio).
@Service
public class RelatorioProcedimentosService implements GeradorRelatorio<RelatorioProcedimentosResponse> {

    private static final String CASTRACAO = "castracao";
    private static final String ATENDIMENTO_CLINICO = "atendimento_clinico";
    private static final String CIRURGIA_MAIOR = "cirurgia_maior";
    private static final String VACINACAO_CODIGO_NAO_USADO_EM_PROCEDIMENTO = "vacinacao";
    private static final int TOP_N_CIRURGIAS = 10;

    private final ProcedimentoRepository procedimentoRepository;
    private final VacinacaoRepository vacinacaoRepository;
    private final PrescricaoRepository prescricaoRepository;

    public RelatorioProcedimentosService(
            ProcedimentoRepository procedimentoRepository,
            VacinacaoRepository vacinacaoRepository,
            PrescricaoRepository prescricaoRepository) {
        this.procedimentoRepository = procedimentoRepository;
        this.vacinacaoRepository = vacinacaoRepository;
        this.prescricaoRepository = prescricaoRepository;
    }

    @Override
    public TipoRelatorio tipo() {
        return TipoRelatorio.PROCEDIMENTOS;
    }

    @Override
    @Transactional(readOnly = true)
    public RelatorioProcedimentosResponse gerarPreview(PeriodoRelatorio periodo) {
        LocalDate inicio = periodo.inicio();
        LocalDate fim = periodo.fim();

        ContagensDoPeriodo contagens = contar(inicio, fim);
        KpisProcedimentosResponse kpis = calcularKpis(inicio, fim, contagens);
        List<ProcedimentoPorTipoResponse> porTipo = montarPorTipo(contagens);
        List<ProdutividadeVeterinarioResponse> porVeterinario = montarPorVeterinario(inicio, fim);
        ProdutividadeVeterinarioResponse totalVeterinarios = somarVeterinarios(porVeterinario);

        List<CirurgiaRealizadaResponse> cirurgias = montarCirurgias(inicio, fim);
        List<CirurgiaRealizadaResponse> topCirurgias = cirurgias.stream().limit(TOP_N_CIRURGIAS).toList();
        long excedente = Math.max(0, cirurgias.size() - TOP_N_CIRURGIAS);

        return new RelatorioProcedimentosResponse(
                inicio, fim, kpis, porTipo, porVeterinario, totalVeterinarios, topCirurgias, excedente);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BlocoCsv> blocosCsv(PeriodoRelatorio periodo) {
        LocalDate inicio = periodo.inicio();
        LocalDate fim = periodo.fim();

        List<List<String>> linhasPorTipo = montarPorTipo(contar(inicio, fim)).stream()
                .map(l -> List.of(l.tipo(), String.valueOf(l.quantidade())))
                .toList();

        List<ProdutividadeVeterinarioResponse> porVeterinario = montarPorVeterinario(inicio, fim);
        List<List<String>> linhasProdutividade = new ArrayList<>(porVeterinario.stream()
                .map(l -> List.of(l.veterinario(), String.valueOf(l.atendimentos()), String.valueOf(l.castracoes()),
                        String.valueOf(l.cirurgias()), String.valueOf(l.vacinacoes()), String.valueOf(l.total())))
                .toList());
        ProdutividadeVeterinarioResponse totalVet = somarVeterinarios(porVeterinario);
        linhasProdutividade.add(List.of("TOTAL", String.valueOf(totalVet.atendimentos()),
                String.valueOf(totalVet.castracoes()), String.valueOf(totalVet.cirurgias()),
                String.valueOf(totalVet.vacinacoes()), String.valueOf(totalVet.total())));

        // CSV exporta a lista COMPLETA de cirurgias, sem o corte de top N do preview/PDF.
        List<List<String>> linhasCirurgias = montarCirurgias(inicio, fim).stream()
                .map(l -> List.of(Formatadores.DATA.format(l.data()), l.animal(), l.procedimento(), l.veterinario(),
                        l.resultado()))
                .toList();

        return List.of(
                new BlocoCsv("Procedimentos por tipo", List.of("Tipo", "Quantidade"), linhasPorTipo),
                new BlocoCsv("Produtividade por veterinário",
                        List.of("Veterinário", "Atendimentos", "Castrações", "Cirurgias", "Vacinações", "Total"),
                        linhasProdutividade),
                new BlocoCsv("Cirurgias realizadas",
                        List.of("Data", "Animal", "Procedimento", "Vet. responsável", "Resultado"), linhasCirurgias));
    }

    // Contagens do periodo usadas tanto pelos KPIs quanto pelo grafico por
    // tipo: consultadas uma vez por requisicao (antes contarPorTipo rodava 3x
    // e as contagens de vacinacao/medicacao 2x no mesmo preview).
    private record ContagensDoPeriodo(List<ContagemCatalogoProjection> porTipo, long vacinacoes, long medicacoes) {
    }

    // Exclui 'vacinacao' do catalogo tipo_procedimento (nunca usado pelo fluxo
    // real de criacao) — Vacinações entra no relatorio via Vacinacao, nao Procedimento.
    private ContagensDoPeriodo contar(LocalDate inicio, LocalDate fim) {
        List<ContagemCatalogoProjection> porTipo = procedimentoRepository.contarPorTipo(inicio, fim).stream()
                .filter(linha -> !VACINACAO_CODIGO_NAO_USADO_EM_PROCEDIMENTO.equals(linha.getCodigo()))
                .toList();
        return new ContagensDoPeriodo(porTipo,
                vacinacaoRepository.countByDataAplicacaoBetween(inicio, fim),
                prescricaoRepository.countByDataInicioBetween(inicio, fim));
    }

    private KpisProcedimentosResponse calcularKpis(LocalDate inicio, LocalDate fim, ContagensDoPeriodo contagens) {
        long castracoesMachos = procedimentoRepository.countByTipoProcedimento_CodigoAndDataBetweenAndAnimal_Sexo(
                CASTRACAO, inicio, fim, "macho");
        long castracoesFemeas = procedimentoRepository.countByTipoProcedimento_CodigoAndDataBetweenAndAnimal_Sexo(
                CASTRACAO, inicio, fim, "femea");
        long castracoes = castracoesMachos + castracoesFemeas;

        Map<String, Long> porTipo = new LinkedHashMap<>();
        contagens.porTipo().forEach(linha -> porTipo.put(linha.getCodigo(), linha.getQuantidade()));
        long atendimentosClinicos = porTipo.getOrDefault(ATENDIMENTO_CLINICO, 0L);
        long cirurgiasMaiores = porTipo.getOrDefault(CIRURGIA_MAIOR, 0L);

        long total = castracoes + atendimentosClinicos + cirurgiasMaiores + contagens.vacinacoes() + contagens.medicacoes();

        return new KpisProcedimentosResponse(total, castracoes, castracoesMachos, castracoesFemeas, atendimentosClinicos, cirurgiasMaiores);
    }

    private List<ProcedimentoPorTipoResponse> montarPorTipo(ContagensDoPeriodo contagens) {
        List<ProcedimentoPorTipoResponse> linhas = new ArrayList<>();
        linhas.add(new ProcedimentoPorTipoResponse("Vacinações", contagens.vacinacoes()));
        contagens.porTipo().forEach(linha -> linhas.add(new ProcedimentoPorTipoResponse(linha.getNome(), linha.getQuantidade())));
        linhas.add(new ProcedimentoPorTipoResponse("Medicações", contagens.medicacoes()));

        return linhas.stream().sorted(Comparator.comparingLong(ProcedimentoPorTipoResponse::quantidade).reversed()).toList();
    }

    private List<ProdutividadeVeterinarioResponse> montarPorVeterinario(LocalDate inicio, LocalDate fim) {
        Map<String, long[]> porVet = new LinkedHashMap<>(); // [atendimentos, castracoes, cirurgias, vacinacoes]

        for (ProdutividadeProcedimentoProjection linha : procedimentoRepository.contarPorVeterinarioETipo(inicio, fim)) {
            long[] valores = porVet.computeIfAbsent(linha.getNome(), k -> new long[4]);
            switch (linha.getTipoCodigo()) {
                case ATENDIMENTO_CLINICO -> valores[0] += linha.getQuantidade();
                case CASTRACAO -> valores[1] += linha.getQuantidade();
                case CIRURGIA_MAIOR -> valores[2] += linha.getQuantidade();
                default -> { /* outros tipos (ex.: vacinacao legado) nao entram nesta tabela */ }
            }
        }

        for (AplicacaoPorVeterinarioProjection linha : vacinacaoRepository.contarAplicacoesPorVeterinario(inicio, fim)) {
            long[] valores = porVet.computeIfAbsent(linha.getNome(), k -> new long[4]);
            valores[3] += linha.getQuantidade();
        }

        return porVet.entrySet().stream()
                .map(entry -> {
                    long[] v = entry.getValue();
                    long total = v[0] + v[1] + v[2] + v[3];
                    return new ProdutividadeVeterinarioResponse(entry.getKey(), v[0], v[1], v[2], v[3], total);
                })
                .sorted(Comparator.comparingLong(ProdutividadeVeterinarioResponse::total).reversed())
                .toList();
    }

    private ProdutividadeVeterinarioResponse somarVeterinarios(List<ProdutividadeVeterinarioResponse> linhas) {
        long atendimentos = linhas.stream().mapToLong(ProdutividadeVeterinarioResponse::atendimentos).sum();
        long castracoes = linhas.stream().mapToLong(ProdutividadeVeterinarioResponse::castracoes).sum();
        long cirurgias = linhas.stream().mapToLong(ProdutividadeVeterinarioResponse::cirurgias).sum();
        long vacinacoes = linhas.stream().mapToLong(ProdutividadeVeterinarioResponse::vacinacoes).sum();
        long total = atendimentos + castracoes + cirurgias + vacinacoes;
        return new ProdutividadeVeterinarioResponse("TOTAL", atendimentos, castracoes, cirurgias, vacinacoes, total);
    }

    private List<CirurgiaRealizadaResponse> montarCirurgias(LocalDate inicio, LocalDate fim) {
        return procedimentoRepository.listarCirurgias(inicio, fim).stream()
                .map(this::paraCirurgiaRealizada)
                .toList();
    }

    private CirurgiaRealizadaResponse paraCirurgiaRealizada(Procedimento procedimento) {
        String nomeProcedimento = procedimento.getDescricao() != null
                ? procedimento.getDescricao()
                : procedimento.getTipoProcedimento().getNome();
        String veterinario = procedimento.getExecutadoPor() != null
                ? procedimento.getExecutadoPor().getNome() + " " + procedimento.getExecutadoPor().getSobrenome()
                : "—";
        return new CirurgiaRealizadaResponse(
                procedimento.getData(), procedimento.getAnimal().getNome(), nomeProcedimento, veterinario,
                procedimento.getResultado() != null ? procedimento.getResultado() : "—");
    }
}
