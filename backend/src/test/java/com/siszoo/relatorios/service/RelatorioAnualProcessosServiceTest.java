package com.siszoo.relatorios.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.siszoo.comum.util.BlocoCsv;
import com.siszoo.processos.repository.AnimalAmostradoRepository;
import com.siszoo.processos.repository.BairroProcessoProjection;
import com.siszoo.processos.repository.ContagemCatalogoProjection;
import com.siszoo.processos.repository.ProcessoSanitarioRepository;
import com.siszoo.processos.repository.ResultadosLaboratoriaisProjection;
import com.siszoo.processos.repository.TempoResolucaoPorLaboratorioProjection;
import com.siszoo.processos.repository.TempoResolucaoProjection;
import com.siszoo.relatorios.dto.PeriodoRelatorio;
import com.siszoo.relatorios.dto.RelatorioAnualProcessosResponse;

@ExtendWith(MockitoExtension.class)
class RelatorioAnualProcessosServiceTest {

    private static final PeriodoRelatorio PERIODO = new PeriodoRelatorio(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 12, 31));

    @Mock
    private ProcessoSanitarioRepository processoSanitarioRepository;
    @Mock
    private AnimalAmostradoRepository animalAmostradoRepository;

    private RelatorioAnualProcessosService service;

    @Test
    void calculaKpisEResultadosComLinhaTotal() {
        service = new RelatorioAnualProcessosService(processoSanitarioRepository, animalAmostradoRepository);

        when(processoSanitarioRepository.countByDataAberturaBetween(PERIODO.inicio(), PERIODO.fim())).thenReturn(87L);
        when(processoSanitarioRepository.countByDataAberturaBetweenAndResultadoLaboratorial_Codigo(
                PERIODO.inicio(), PERIODO.fim(), "positivo")).thenReturn(14L);
        when(animalAmostradoRepository.contarProcessosComContatoHumano(PERIODO.inicio(), PERIODO.fim())).thenReturn(9L);
        List<TempoResolucaoProjection> tempos = List.of(tempoResolucao(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 12))); // 11 dias
        when(processoSanitarioRepository.listarTemposDeResolucao(any(), any())).thenReturn(tempos);
        when(processoSanitarioRepository.contarPorDoenca(2025)).thenReturn(List.of());
        ResultadosLaboratoriaisProjection raiva = resultadoDetalhado("Raiva", 28, 2, 24, 1, 1);
        List<ResultadosLaboratoriaisProjection> resultados = List.of(raiva);
        when(processoSanitarioRepository.contarResultadosDetalhadoPorDoenca(any(), any())).thenReturn(resultados);
        when(animalAmostradoRepository.contarPorEspecieNoPeriodo(any(), any())).thenReturn(List.of());
        when(processoSanitarioRepository.contarPorBairro(any(), any())).thenReturn(List.of());
        when(processoSanitarioRepository.contarPorBairroEDoenca(any(), any())).thenReturn(List.of());
        when(processoSanitarioRepository.countByOcorrenciaIsNullAndDataAberturaBetween(any(), any())).thenReturn(0L);
        when(animalAmostradoRepository.contarAmostrasPorLaboratorio(any(), any())).thenReturn(List.of());
        when(processoSanitarioRepository.listarTemposDeResolucaoPorLaboratorio(any(), any())).thenReturn(List.of());

        RelatorioAnualProcessosResponse resposta = service.gerarPreview(PERIODO);

        assertThat(resposta.ano()).isEqualTo(2025);
        assertThat(resposta.kpis().processosAbertos()).isEqualTo(87);
        assertThat(resposta.kpis().confirmadosPositivos()).isEqualTo(14);
        assertThat(resposta.kpis().percentualPositividade()).isEqualTo(16); // 14/87 = 16.09 -> 16
        assertThat(resposta.kpis().comContatoHumano()).isEqualTo(9);
        assertThat(resposta.kpis().tempoMedioDias()).isEqualTo(11.0);

        assertThat(resposta.resultadosPorDoenca()).hasSize(1);
        assertThat(resposta.resultadosPorDoenca().get(0).percentualPositividade()).isEqualTo(7); // 2/28 = 7.1
        assertThat(resposta.totalResultados().doenca()).isEqualTo("TOTAL");
        assertThat(resposta.totalResultados().investigados()).isEqualTo(28);
        assertThat(resposta.totalResultados().positivos()).isEqualTo(2);
    }

    @Test
    void agrupaBairrosEmTop9MaisOutrosMaisSemOcorrenciaVinculada() {
        service = new RelatorioAnualProcessosService(processoSanitarioRepository, animalAmostradoRepository);

        stubsBasicosVazios();
        List<BairroProcessoProjection> bairros = java.util.stream.IntStream.rangeClosed(1, 11)
                .mapToObj(i -> bairro("Bairro " + i, 20L - i, 1L))
                .toList();
        when(processoSanitarioRepository.contarPorBairro(any(), any())).thenReturn(bairros);
        when(processoSanitarioRepository.contarPorBairroEDoenca(any(), any())).thenReturn(List.of());
        when(processoSanitarioRepository.countByOcorrenciaIsNullAndDataAberturaBetween(any(), any())).thenReturn(5L);

        RelatorioAnualProcessosResponse resposta = service.gerarPreview(PERIODO);

        // 11 bairros com ocorrencia: 9 no top + 1 "Outros (2 bairros)" + 1 "Sem ocorrência vinculada".
        assertThat(resposta.bairros()).hasSize(11);
        assertThat(resposta.bairros().get(9).bairro()).isEqualTo("Outros (2 bairros)");
        assertThat(resposta.bairros().get(10).bairro()).isEqualTo("Sem ocorrência vinculada");
        assertThat(resposta.bairros().get(10).processos()).isEqualTo(5);
    }

    @Test
    void laboratorioUsaProxyDeAberturaParaResultadoNoTempoMedio() {
        service = new RelatorioAnualProcessosService(processoSanitarioRepository, animalAmostradoRepository);

        stubsBasicosVazios();
        ContagemCatalogoProjection pasteur = contagem("pasteur_sp", "Instituto Pasteur — SP", 31L);
        when(animalAmostradoRepository.contarAmostrasPorLaboratorio(any(), any())).thenReturn(List.of(pasteur));
        TempoResolucaoPorLaboratorioProjection tempo = tempoLaboratorio("pasteur_sp", LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 9));
        when(processoSanitarioRepository.listarTemposDeResolucaoPorLaboratorio(any(), any())).thenReturn(List.of(tempo));

        RelatorioAnualProcessosResponse resposta = service.gerarPreview(PERIODO);

        assertThat(resposta.laboratorios()).hasSize(1);
        assertThat(resposta.laboratorios().get(0).percentualDoTotal()).isEqualTo(100);
        assertThat(resposta.laboratorios().get(0).tempoMedioDias()).isEqualTo(8.0);
    }

    @Test
    void csvExportaTodosOsBairrosSemTopNDoPreview() {
        service = new RelatorioAnualProcessosService(processoSanitarioRepository, animalAmostradoRepository);

        stubsBasicosVazios();
        List<BairroProcessoProjection> bairros = java.util.stream.IntStream.rangeClosed(1, 11)
                .mapToObj(i -> bairro("Bairro " + i, 1L, 0L))
                .toList();
        when(processoSanitarioRepository.contarPorBairro(any(), any())).thenReturn(bairros);

        List<BlocoCsv> blocos = service.blocosCsv(PERIODO);
        BlocoCsv blocoBairros = blocos.stream().filter(b -> b.titulo().equals("Bairros com mais ocorrências")).findFirst().orElseThrow();
        assertThat(blocoBairros.linhas()).hasSize(11); // sem agregacao "Outros"
    }

    // lenient: cada teste usa so um subconjunto (blocosCsv nao chama os
    // metodos de KPI, por exemplo) — stub nao usado aqui e esperado, nao um
    // erro de teste (ao contrario do UnnecessaryStubbingException padrao).
    private void stubsBasicosVazios() {
        org.mockito.Mockito.lenient().when(processoSanitarioRepository.countByDataAberturaBetween(any(), any())).thenReturn(0L);
        org.mockito.Mockito.lenient().when(processoSanitarioRepository.countByDataAberturaBetweenAndResultadoLaboratorial_Codigo(any(), any(), eq("positivo"))).thenReturn(0L);
        org.mockito.Mockito.lenient().when(animalAmostradoRepository.contarProcessosComContatoHumano(any(), any())).thenReturn(0L);
        org.mockito.Mockito.lenient().when(processoSanitarioRepository.listarTemposDeResolucao(any(), any())).thenReturn(List.of());
        org.mockito.Mockito.lenient().when(processoSanitarioRepository.contarPorDoenca(any(Integer.class))).thenReturn(List.of());
        when(processoSanitarioRepository.contarResultadosDetalhadoPorDoenca(any(), any())).thenReturn(List.of());
        when(animalAmostradoRepository.contarPorEspecieNoPeriodo(any(), any())).thenReturn(List.of());
        when(processoSanitarioRepository.contarPorBairro(any(), any())).thenReturn(List.of());
        when(processoSanitarioRepository.contarPorBairroEDoenca(any(), any())).thenReturn(List.of());
        when(processoSanitarioRepository.countByOcorrenciaIsNullAndDataAberturaBetween(any(), any())).thenReturn(0L);
        when(animalAmostradoRepository.contarAmostrasPorLaboratorio(any(), any())).thenReturn(List.of());
        when(processoSanitarioRepository.listarTemposDeResolucaoPorLaboratorio(any(), any())).thenReturn(List.of());
    }

    private TempoResolucaoProjection tempoResolucao(LocalDate abertura, LocalDate resultado) {
        TempoResolucaoProjection projecao = mock(TempoResolucaoProjection.class);
        when(projecao.getDataAbertura()).thenReturn(abertura);
        when(projecao.getDataResultado()).thenReturn(resultado);
        return projecao;
    }

    // "codigo" nao e lido pelo service (paraResultadoResponse so usa nome e
    // os contadores) — nao stubado, de proposito, pra nao disparar
    // UnnecessaryStubbingException.
    private ResultadosLaboratoriaisProjection resultadoDetalhado(
            String nome, long investigados, long positivos, long negativos, long inconclusivos, long aguardando) {
        ResultadosLaboratoriaisProjection projecao = mock(ResultadosLaboratoriaisProjection.class);
        when(projecao.getNome()).thenReturn(nome);
        when(projecao.getInvestigados()).thenReturn(investigados);
        when(projecao.getPositivos()).thenReturn(positivos);
        when(projecao.getNegativos()).thenReturn(negativos);
        when(projecao.getInconclusivos()).thenReturn(inconclusivos);
        when(projecao.getAguardando()).thenReturn(aguardando);
        return projecao;
    }

    private BairroProcessoProjection bairro(String bairro, long processos, long positivos) {
        BairroProcessoProjection projecao = mock(BairroProcessoProjection.class);
        when(projecao.getBairro()).thenReturn(bairro);
        when(projecao.getProcessos()).thenReturn(processos);
        when(projecao.getPositivos()).thenReturn(positivos);
        return projecao;
    }

    private ContagemCatalogoProjection contagem(String codigo, String nome, long quantidade) {
        ContagemCatalogoProjection projecao = mock(ContagemCatalogoProjection.class);
        when(projecao.getCodigo()).thenReturn(codigo);
        when(projecao.getNome()).thenReturn(nome);
        when(projecao.getQuantidade()).thenReturn(quantidade);
        return projecao;
    }

    private TempoResolucaoPorLaboratorioProjection tempoLaboratorio(String codigo, LocalDate abertura, LocalDate resultado) {
        TempoResolucaoPorLaboratorioProjection projecao = mock(TempoResolucaoPorLaboratorioProjection.class);
        when(projecao.getLaboratorioCodigo()).thenReturn(codigo);
        when(projecao.getDataAbertura()).thenReturn(abertura);
        when(projecao.getDataResultado()).thenReturn(resultado);
        return projecao;
    }
}
