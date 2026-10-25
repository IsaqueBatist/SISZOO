package com.siszoo.relatorios.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.siszoo.ocorrencias.repository.BairroTipoProjection;
import com.siszoo.ocorrencias.repository.ContagemPorBairroProjection;
import com.siszoo.ocorrencias.repository.OcorrenciaRepository;
import com.siszoo.ocorrencias.repository.TempoAtendimentoProjection;
import com.siszoo.relatorios.dto.PeriodoRelatorio;
import com.siszoo.relatorios.dto.RelatorioOcorrenciasBairroResponse;

@ExtendWith(MockitoExtension.class)
class RelatorioOcorrenciasBairroServiceTest {

    private static final PeriodoRelatorio PERIODO = new PeriodoRelatorio(LocalDate.of(2026, 1, 1), LocalDate.of(2026, 5, 20));

    @Mock
    private OcorrenciaRepository ocorrenciaRepository;

    private RelatorioOcorrenciasBairroService service;

    @Test
    void calculaKpisETipoPredominantePorBairro() {
        service = new RelatorioOcorrenciasBairroService(ocorrenciaRepository);

        when(ocorrenciaRepository.contarRegistradasNoPeriodo(any(), any())).thenReturn(218L);
        when(ocorrenciaRepository.contarBairrosAtingidos(any(), any())).thenReturn(21L);
        when(ocorrenciaRepository.contarEncerradasNoPeriodo(any(), any())).thenReturn(207L);

        List<ContagemPorBairroProjection> bairros = List.of(porBairro("Centro", 42L));
        List<BairroTipoProjection> bairrosTipos = List.of(
                bairroTipo("Centro", "Infestação de Morcegos", 30L),
                bairroTipo("Centro", "Animal Agressivo", 12L));
        List<TempoAtendimentoProjection> tempos = List.of(
                tempo("Centro", LocalDateTime.of(2026, 3, 1, 8, 0), LocalDateTime.of(2026, 3, 1, 10, 48))); // 2.8h

        when(ocorrenciaRepository.contarPorBairro(any(), any())).thenReturn(bairros);
        when(ocorrenciaRepository.contarPorBairroETipo(any(), any())).thenReturn(bairrosTipos);
        when(ocorrenciaRepository.listarTemposDeAtendimento(any(), any())).thenReturn(tempos);
        when(ocorrenciaRepository.contarPorTipo(any(), any())).thenReturn(List.of());

        RelatorioOcorrenciasBairroResponse resposta = service.gerarPreview(PERIODO);

        assertThat(resposta.kpis().ocorrenciasRegistradas()).isEqualTo(218);
        assertThat(resposta.kpis().percentualEncerradas()).isEqualTo(95); // 207/218 ~ 94.9 -> arredonda 95
        assertThat(resposta.kpis().tempoMedioHoras()).isEqualTo(2.8);
        assertThat(resposta.bairros()).hasSize(1);
        assertThat(resposta.bairros().get(0).tipoPredominante()).isEqualTo("Infestação de Morcegos");
        assertThat(resposta.bairros().get(0).tempoMedioHoras()).isEqualTo(2.8);
        // T45: KPIs e linhas por bairro usam a mesma consulta de tempos.
        verify(ocorrenciaRepository, times(1)).listarTemposDeAtendimento(any(), any());
    }

    @Test
    void agregaBairrosExcedentesEmUmaLinhaOutros() {
        service = new RelatorioOcorrenciasBairroService(ocorrenciaRepository);

        when(ocorrenciaRepository.contarRegistradasNoPeriodo(any(), any())).thenReturn(100L);
        when(ocorrenciaRepository.contarBairrosAtingidos(any(), any())).thenReturn(12L);
        when(ocorrenciaRepository.contarEncerradasNoPeriodo(any(), any())).thenReturn(90L);
        when(ocorrenciaRepository.contarPorBairroETipo(any(), any())).thenReturn(List.of());
        when(ocorrenciaRepository.listarTemposDeAtendimento(any(), any())).thenReturn(List.of());
        when(ocorrenciaRepository.contarPorTipo(any(), any())).thenReturn(List.of());

        // 12 bairros: 9 ficam no top, 3 vao para "Outros".
        List<ContagemPorBairroProjection> bairros = java.util.stream.IntStream.rangeClosed(1, 12)
                .mapToObj(i -> porBairro("Bairro " + i, 13L - i))
                .toList();
        when(ocorrenciaRepository.contarPorBairro(any(), any())).thenReturn(bairros);

        RelatorioOcorrenciasBairroResponse resposta = service.gerarPreview(PERIODO);

        assertThat(resposta.bairros()).hasSize(10); // 9 + "Outros"
        assertThat(resposta.bairros().get(9).bairro()).isEqualTo("Outros (3 bairros)");
        // bairros 10,11,12 tem quantidade 3,2,1 -> soma 6
        assertThat(resposta.bairros().get(9).ocorrencias()).isEqualTo(6);
    }

    @Test
    void csvExportaTodosOsBairrosSemAgregarOutros() {
        service = new RelatorioOcorrenciasBairroService(ocorrenciaRepository);

        when(ocorrenciaRepository.contarPorBairroETipo(any(), any())).thenReturn(List.of());
        when(ocorrenciaRepository.listarTemposDeAtendimento(any(), any())).thenReturn(List.of());
        when(ocorrenciaRepository.contarPorTipo(any(), any())).thenReturn(List.of());

        List<ContagemPorBairroProjection> bairros = java.util.stream.IntStream.rangeClosed(1, 12)
                .mapToObj(i -> porBairro("Bairro " + i, 1L))
                .toList();
        when(ocorrenciaRepository.contarPorBairro(any(), any())).thenReturn(bairros);

        var blocos = service.blocosCsv(PERIODO);
        var blocoBairros = blocos.stream().filter(b -> b.titulo().equals("Bairros com mais ocorrências")).findFirst().orElseThrow();
        assertThat(blocoBairros.linhas()).hasSize(12);
    }

    private ContagemPorBairroProjection porBairro(String bairro, long quantidade) {
        ContagemPorBairroProjection projecao = mock(ContagemPorBairroProjection.class);
        when(projecao.getBairro()).thenReturn(bairro);
        when(projecao.getQuantidade()).thenReturn(quantidade);
        return projecao;
    }

    private BairroTipoProjection bairroTipo(String bairro, String tipo, long quantidade) {
        BairroTipoProjection projecao = mock(BairroTipoProjection.class);
        when(projecao.getBairro()).thenReturn(bairro);
        when(projecao.getTipo()).thenReturn(tipo);
        when(projecao.getQuantidade()).thenReturn(quantidade);
        return projecao;
    }

    private TempoAtendimentoProjection tempo(String bairro, LocalDateTime criadoEm, LocalDateTime encerradaEm) {
        TempoAtendimentoProjection projecao = mock(TempoAtendimentoProjection.class);
        when(projecao.getBairro()).thenReturn(bairro);
        when(projecao.getCriadoEm()).thenReturn(criadoEm);
        when(projecao.getEncerradaEm()).thenReturn(encerradaEm);
        return projecao;
    }
}
