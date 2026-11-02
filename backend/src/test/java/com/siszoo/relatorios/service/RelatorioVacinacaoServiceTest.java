package com.siszoo.relatorios.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.siszoo.animais.clinico.entity.Vacina;
import com.siszoo.animais.clinico.entity.Vacinacao;
import com.siszoo.animais.clinico.repository.AplicacaoPorVeterinarioProjection;
import com.siszoo.animais.clinico.repository.VacinacaoRepository;
import com.siszoo.animais.entity.Animal;
import com.siszoo.animais.entity.Baia;
import com.siszoo.animais.repository.AnimalRepository;
import com.siszoo.comum.util.BlocoCsv;
import com.siszoo.relatorios.dto.PeriodoRelatorio;
import com.siszoo.relatorios.dto.RelatorioVacinacaoResponse;

@ExtendWith(MockitoExtension.class)
class RelatorioVacinacaoServiceTest {

    private static final ZoneId FUSO = ZoneId.of("America/Sao_Paulo");
    private static final LocalDate HOJE = LocalDate.of(2026, 9, 10);
    private static final Clock CLOCK = Clock.fixed(HOJE.atStartOfDay(FUSO).toInstant(), FUSO);
    private static final PeriodoRelatorio PERIODO = new PeriodoRelatorio(LocalDate.of(2026, 1, 1), HOJE);

    @Mock
    private VacinacaoRepository vacinacaoRepository;
    @Mock
    private AnimalRepository animalRepository;

    private RelatorioVacinacaoService service;

    @Test
    void deveComputarKpisDeVencidasEAVencerEm30Dias() {
        service = new RelatorioVacinacaoService(vacinacaoRepository, animalRepository, CLOCK);

        Vacinacao vencida = vacinacao(HOJE.minusMonths(12).minusDays(1), 12, null);
        Vacinacao aVencer = vacinacao(HOJE.minusMonths(12).plusDays(10), 12, null);
        Vacinacao emDia = vacinacao(HOJE.minusDays(1), 12, null);

        when(vacinacaoRepository.findVigentesParaAlertaVacinal(any())).thenReturn(List.of(vencida, aVencer, emDia));
        when(animalRepository.countByStatus_CodigoNotIn(any())).thenReturn(10L);
        when(vacinacaoRepository.countByDataAplicacaoBetween(PERIODO.inicio(), PERIODO.fim())).thenReturn(50L);
        when(vacinacaoRepository.contarAplicacoesPorVacina(PERIODO.inicio(), PERIODO.fim())).thenReturn(List.of());
        when(vacinacaoRepository.contarAplicacoesPorVeterinario(PERIODO.inicio(), PERIODO.fim())).thenReturn(List.of());

        RelatorioVacinacaoResponse resposta = service.gerarPreview(PERIODO);

        assertThat(resposta.kpis().vacinasAplicadas()).isEqualTo(50);
        assertThat(resposta.kpis().vencidas()).isEqualTo(1);
        assertThat(resposta.kpis().aVencerEm30Dias()).isEqualTo(1);
        assertThat(resposta.kpis().animaisVacinados()).isEqualTo(2);
        assertThat(resposta.kpis().percentualAnimaisVacinados()).isEqualTo(20);
        assertThat(resposta.animaisVencidos()).hasSize(1);
        assertThat(resposta.animaisVencidos().get(0).diasAtraso()).isEqualTo(1);
    }

    @Test
    void previewLimitaATop10ComExcedenteMasCsvExportaListaCompleta() {
        service = new RelatorioVacinacaoService(vacinacaoRepository, animalRepository, CLOCK);

        List<Vacinacao> vencidas = new ArrayList<>();
        for (int i = 1; i <= 12; i++) {
            vencidas.add(vacinacao(HOJE.minusMonths(12).minusDays(i), 12, null));
        }
        when(vacinacaoRepository.findVigentesParaAlertaVacinal(any())).thenReturn(vencidas);
        when(animalRepository.countByStatus_CodigoNotIn(any())).thenReturn(12L);
        when(vacinacaoRepository.countByDataAplicacaoBetween(any(), any())).thenReturn(0L);
        when(vacinacaoRepository.contarAplicacoesPorVacina(any(), any())).thenReturn(List.of());
        when(vacinacaoRepository.contarAplicacoesPorVeterinario(any(), any())).thenReturn(List.of());

        RelatorioVacinacaoResponse preview = service.gerarPreview(PERIODO);
        assertThat(preview.animaisVencidos()).hasSize(10);
        assertThat(preview.animaisVencidosExcedente()).isEqualTo(2);
        assertThat(preview.animaisVencidos().get(0).diasAtraso()).isEqualTo(12);

        List<BlocoCsv> blocos = service.blocosCsv(PERIODO);
        BlocoCsv blocoVencidas = blocos.stream().filter(b -> b.titulo().equals("Animais com Vacinas Vencidas")).findFirst().orElseThrow();
        assertThat(blocoVencidas.linhas()).hasSize(12);
    }

    @Test
    void montaPorVeterinarioAPartirDaProjecao() {
        service = new RelatorioVacinacaoService(vacinacaoRepository, animalRepository, CLOCK);
        when(vacinacaoRepository.findVigentesParaAlertaVacinal(any())).thenReturn(List.of());
        when(animalRepository.countByStatus_CodigoNotIn(any())).thenReturn(0L);
        when(vacinacaoRepository.countByDataAplicacaoBetween(any(), any())).thenReturn(0L);
        when(vacinacaoRepository.contarAplicacoesPorVacina(any(), any())).thenReturn(List.of());
        List<AplicacaoPorVeterinarioProjection> veterinarios =
                List.of(veterinario("Dra. Stéphanie Lima", 185L), veterinario("Dr. Rafael Souza", 136L));
        when(vacinacaoRepository.contarAplicacoesPorVeterinario(PERIODO.inicio(), PERIODO.fim())).thenReturn(veterinarios);

        RelatorioVacinacaoResponse resposta = service.gerarPreview(PERIODO);

        assertThat(resposta.porVeterinario()).extracting("veterinario", "aplicacoes")
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple("Dra. Stéphanie Lima", 185L),
                        org.assertj.core.groups.Tuple.tuple("Dr. Rafael Souza", 136L));
    }

    private Vacinacao vacinacao(LocalDate dataAplicacao, int intervaloMeses, Baia baia) {
        Animal animal = new Animal();
        animal.setId(UUID.randomUUID());
        animal.setNome("Animal Teste");
        animal.setBaia(baia);

        Vacina vacina = new Vacina();
        vacina.setNome("Antirrábica");
        vacina.setIntervaloMeses(intervaloMeses);
        vacina.setAtivo(true);

        Vacinacao vacinacao = new Vacinacao();
        vacinacao.setAnimal(animal);
        vacinacao.setVacina(vacina);
        vacinacao.setDataAplicacao(dataAplicacao);
        vacinacao.setDoseQuantidade(new BigDecimal("1.000"));
        return vacinacao;
    }

    private AplicacaoPorVeterinarioProjection veterinario(String nome, long quantidade) {
        AplicacaoPorVeterinarioProjection projecao = mock(AplicacaoPorVeterinarioProjection.class);
        when(projecao.getNome()).thenReturn(nome);
        when(projecao.getQuantidade()).thenReturn(quantidade);
        return projecao;
    }
}
