package com.siszoo.relatorios.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.siszoo.animais.clinico.entity.Procedimento;
import com.siszoo.animais.clinico.entity.TipoProcedimento;
import com.siszoo.animais.clinico.repository.AplicacaoPorVeterinarioProjection;
import com.siszoo.animais.clinico.repository.PrescricaoRepository;
import com.siszoo.animais.clinico.repository.ProcedimentoRepository;
import com.siszoo.animais.clinico.repository.ProdutividadeProcedimentoProjection;
import com.siszoo.animais.clinico.repository.VacinacaoRepository;
import com.siszoo.animais.entity.Animal;
import com.siszoo.comum.util.BlocoCsv;
import com.siszoo.processos.repository.ContagemCatalogoProjection;
import com.siszoo.relatorios.dto.PeriodoRelatorio;
import com.siszoo.relatorios.dto.RelatorioProcedimentosResponse;
import com.siszoo.usuarios.entity.Usuario;

@ExtendWith(MockitoExtension.class)
class RelatorioProcedimentosServiceTest {

    private static final PeriodoRelatorio PERIODO = new PeriodoRelatorio(LocalDate.of(2026, 4, 1), LocalDate.of(2026, 4, 30));

    @Mock
    private ProcedimentoRepository procedimentoRepository;
    @Mock
    private VacinacaoRepository vacinacaoRepository;
    @Mock
    private PrescricaoRepository prescricaoRepository;

    private RelatorioProcedimentosService service;

    @Test
    void calculaTotalComoSomaDasCincoFontes() {
        service = new RelatorioProcedimentosService(procedimentoRepository, vacinacaoRepository, prescricaoRepository);

        when(procedimentoRepository.countByTipoProcedimento_CodigoAndDataBetweenAndAnimal_Sexo(
                "castracao", PERIODO.inicio(), PERIODO.fim(), "macho")).thenReturn(21L);
        when(procedimentoRepository.countByTipoProcedimento_CodigoAndDataBetweenAndAnimal_Sexo(
                "castracao", PERIODO.inicio(), PERIODO.fim(), "femea")).thenReturn(13L);
        ContagemCatalogoProjection atendimento = contagem("atendimento_clinico", "Atendimento clínico", 87L);
        ContagemCatalogoProjection cirurgia = contagem("cirurgia_maior", "Cirurgia maior", 12L);
        when(procedimentoRepository.contarPorTipo(PERIODO.inicio(), PERIODO.fim())).thenReturn(List.of(atendimento, cirurgia));
        when(procedimentoRepository.contarPorVeterinarioETipo(any(), any())).thenReturn(List.of());
        when(vacinacaoRepository.contarAplicacoesPorVeterinario(any(), any())).thenReturn(List.of());
        when(vacinacaoRepository.countByDataAplicacaoBetween(PERIODO.inicio(), PERIODO.fim())).thenReturn(159L);
        when(prescricaoRepository.countByDataInicioBetween(PERIODO.inicio(), PERIODO.fim())).thenReturn(26L);
        when(procedimentoRepository.listarCirurgias(any(), any())).thenReturn(List.of());

        RelatorioProcedimentosResponse resposta = service.gerarPreview(PERIODO);

        assertThat(resposta.kpis().castracoes()).isEqualTo(34);
        assertThat(resposta.kpis().castracoesMachos()).isEqualTo(21);
        assertThat(resposta.kpis().castracoesFemeas()).isEqualTo(13);
        assertThat(resposta.kpis().atendimentosClinicos()).isEqualTo(87);
        assertThat(resposta.kpis().cirurgiasMaiores()).isEqualTo(12);
        // 34 (castracoes) + 87 (atendimentos) + 12 (cirurgias) + 159 (vacinacoes) + 26 (medicacoes)
        assertThat(resposta.kpis().totalProcedimentos()).isEqualTo(318);

        // T45: KPIs e grafico por tipo compartilham as contagens; cada uma vai
        // ao banco uma vez por preview.
        verify(procedimentoRepository, times(1)).contarPorTipo(PERIODO.inicio(), PERIODO.fim());
        verify(vacinacaoRepository, times(1)).countByDataAplicacaoBetween(PERIODO.inicio(), PERIODO.fim());
        verify(prescricaoRepository, times(1)).countByDataInicioBetween(PERIODO.inicio(), PERIODO.fim());
        verify(procedimentoRepository, times(1)).countByTipoProcedimento_CodigoAndDataBetweenAndAnimal_Sexo(
                "castracao", PERIODO.inicio(), PERIODO.fim(), "macho");
        verify(procedimentoRepository, times(1)).countByTipoProcedimento_CodigoAndDataBetweenAndAnimal_Sexo(
                "castracao", PERIODO.inicio(), PERIODO.fim(), "femea");
    }

    @Test
    void ignoraLinhaDeProcedimentoComTipoVacinacaoDoCatalogoLegado() {
        service = new RelatorioProcedimentosService(procedimentoRepository, vacinacaoRepository, prescricaoRepository);

        when(procedimentoRepository.countByTipoProcedimento_CodigoAndDataBetweenAndAnimal_Sexo(
                any(), any(), any(), any())).thenReturn(0L);
        // Linha legada/teorica com tipo 'vacinacao' no catalogo de Procedimento —
        // nao deve ser somada, pois Vacinações vem de Vacinacao, nao de Procedimento.
        // getNome()/getQuantidade() nao sao stubados: o service filtra pelo
        // codigo ANTES de ler esses campos, entao nunca deveriam ser chamados
        // para esta linha — stubar e nao usar quebraria com UnnecessaryStubbingException.
        ContagemCatalogoProjection vacinacaoLegada = mock(ContagemCatalogoProjection.class);
        when(vacinacaoLegada.getCodigo()).thenReturn("vacinacao");
        when(procedimentoRepository.contarPorTipo(any(), any())).thenReturn(List.of(vacinacaoLegada));
        when(procedimentoRepository.contarPorVeterinarioETipo(any(), any())).thenReturn(List.of());
        when(vacinacaoRepository.contarAplicacoesPorVeterinario(any(), any())).thenReturn(List.of());
        when(vacinacaoRepository.countByDataAplicacaoBetween(any(), any())).thenReturn(10L);
        when(prescricaoRepository.countByDataInicioBetween(any(), any())).thenReturn(0L);
        when(procedimentoRepository.listarCirurgias(any(), any())).thenReturn(List.of());

        RelatorioProcedimentosResponse resposta = service.gerarPreview(PERIODO);

        assertThat(resposta.kpis().totalProcedimentos()).isEqualTo(10); // só as 10 vacinações reais, não 999+10
        assertThat(resposta.porTipo()).extracting("tipo").doesNotContain("Vacinação");
    }

    @Test
    void fundeProdutividadeDeProcedimentoEVacinacaoPorNomeDoVeterinario() {
        service = new RelatorioProcedimentosService(procedimentoRepository, vacinacaoRepository, prescricaoRepository);

        when(procedimentoRepository.countByTipoProcedimento_CodigoAndDataBetweenAndAnimal_Sexo(
                any(), any(), any(), any())).thenReturn(0L);
        when(procedimentoRepository.contarPorTipo(any(), any())).thenReturn(List.of());
        ProdutividadeProcedimentoProjection atendimentoStephanie = produtividade("Stéphanie Lima", "atendimento_clinico", 28L);
        when(procedimentoRepository.contarPorVeterinarioETipo(any(), any())).thenReturn(List.of(atendimentoStephanie));
        AplicacaoPorVeterinarioProjection vacinaStephanie = aplicacaoVeterinario("Stéphanie Lima", 62L);
        when(vacinacaoRepository.contarAplicacoesPorVeterinario(any(), any())).thenReturn(List.of(vacinaStephanie));
        when(vacinacaoRepository.countByDataAplicacaoBetween(any(), any())).thenReturn(62L);
        when(prescricaoRepository.countByDataInicioBetween(any(), any())).thenReturn(0L);
        when(procedimentoRepository.listarCirurgias(any(), any())).thenReturn(List.of());

        RelatorioProcedimentosResponse resposta = service.gerarPreview(PERIODO);

        assertThat(resposta.porVeterinario()).hasSize(1);
        assertThat(resposta.porVeterinario().get(0).veterinario()).isEqualTo("Stéphanie Lima");
        assertThat(resposta.porVeterinario().get(0).atendimentos()).isEqualTo(28);
        assertThat(resposta.porVeterinario().get(0).vacinacoes()).isEqualTo(62);
        assertThat(resposta.porVeterinario().get(0).total()).isEqualTo(90);
        assertThat(resposta.totalVeterinarios().total()).isEqualTo(90);
    }

    @Test
    void previewLimitaATop10CirurgiasMasCsvExportaListaCompleta() {
        service = new RelatorioProcedimentosService(procedimentoRepository, vacinacaoRepository, prescricaoRepository);

        when(procedimentoRepository.countByTipoProcedimento_CodigoAndDataBetweenAndAnimal_Sexo(
                any(), any(), any(), any())).thenReturn(0L);
        when(procedimentoRepository.contarPorTipo(any(), any())).thenReturn(List.of());
        when(procedimentoRepository.contarPorVeterinarioETipo(any(), any())).thenReturn(List.of());
        when(vacinacaoRepository.contarAplicacoesPorVeterinario(any(), any())).thenReturn(List.of());
        when(vacinacaoRepository.countByDataAplicacaoBetween(any(), any())).thenReturn(0L);
        when(prescricaoRepository.countByDataInicioBetween(any(), any())).thenReturn(0L);

        List<Procedimento> cirurgias = java.util.stream.IntStream.rangeClosed(1, 12)
                .mapToObj(i -> cirurgia(PERIODO.inicio().plusDays(i), "Animal " + i))
                .toList();
        when(procedimentoRepository.listarCirurgias(any(), any())).thenReturn(cirurgias);

        RelatorioProcedimentosResponse preview = service.gerarPreview(PERIODO);
        assertThat(preview.cirurgias()).hasSize(10);
        assertThat(preview.cirurgiasExcedente()).isEqualTo(2);

        List<BlocoCsv> blocos = service.blocosCsv(PERIODO);
        BlocoCsv blocoCirurgias = blocos.stream().filter(b -> b.titulo().equals("Cirurgias realizadas")).findFirst().orElseThrow();
        assertThat(blocoCirurgias.linhas()).hasSize(12);
    }

    private ContagemCatalogoProjection contagem(String codigo, String nome, long quantidade) {
        ContagemCatalogoProjection projecao = mock(ContagemCatalogoProjection.class);
        when(projecao.getCodigo()).thenReturn(codigo);
        when(projecao.getNome()).thenReturn(nome);
        when(projecao.getQuantidade()).thenReturn(quantidade);
        return projecao;
    }

    private ProdutividadeProcedimentoProjection produtividade(String nome, String tipoCodigo, long quantidade) {
        ProdutividadeProcedimentoProjection projecao = mock(ProdutividadeProcedimentoProjection.class);
        when(projecao.getNome()).thenReturn(nome);
        when(projecao.getTipoCodigo()).thenReturn(tipoCodigo);
        when(projecao.getQuantidade()).thenReturn(quantidade);
        return projecao;
    }

    private AplicacaoPorVeterinarioProjection aplicacaoVeterinario(String nome, long quantidade) {
        AplicacaoPorVeterinarioProjection projecao = mock(AplicacaoPorVeterinarioProjection.class);
        when(projecao.getNome()).thenReturn(nome);
        when(projecao.getQuantidade()).thenReturn(quantidade);
        return projecao;
    }

    private Procedimento cirurgia(LocalDate data, String animalNome) {
        Animal animal = new Animal();
        animal.setId(UUID.randomUUID());
        animal.setNome(animalNome);

        TipoProcedimento tipo = new TipoProcedimento();
        tipo.setCodigo("cirurgia_maior");
        tipo.setNome("Cirurgia maior");

        Usuario vet = new Usuario();
        vet.setNome("Maria");
        vet.setSobrenome("Isabel");

        Procedimento procedimento = new Procedimento();
        procedimento.setAnimal(animal);
        procedimento.setTipoProcedimento(tipo);
        procedimento.setData(data);
        procedimento.setExecutadoPor(vet);
        return procedimento;
    }
}
