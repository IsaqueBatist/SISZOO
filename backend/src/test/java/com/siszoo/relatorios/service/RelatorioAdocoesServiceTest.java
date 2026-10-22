package com.siszoo.relatorios.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.siszoo.animais.repository.AnimalRepository;
import com.siszoo.animais.repository.ContagemPorCaracteristicaProjection;
import com.siszoo.relatorios.dto.PeriodoRelatorio;
import com.siszoo.relatorios.dto.RelatorioAdocoesResponse;

// Versao simplificada (sem tabela `adocao` no schema) — ver comentario de
// RelatorioAdocoesResponse. O periodo e aceito mas NAO filtra os dados
// (snapshot atual de Animal.status = 'adotado').
@ExtendWith(MockitoExtension.class)
class RelatorioAdocoesServiceTest {

    private static final PeriodoRelatorio PERIODO = new PeriodoRelatorio(LocalDate.of(2026, 1, 1), LocalDate.of(2026, 3, 31));

    @Mock
    private AnimalRepository animalRepository;

    private RelatorioAdocoesService service;

    @Test
    void calculaPercentuaisDePerfilComBaseNoTotalDeAdotados() {
        service = new RelatorioAdocoesService(animalRepository);

        when(animalRepository.countByStatus_Codigo("adotado")).thenReturn(24L);
        List<ContagemPorCaracteristicaProjection> porEspecie = List.of(
                caracteristica("Canino", 17L), caracteristica("Felino", 7L));
        List<ContagemPorCaracteristicaProjection> porPorte = List.of(
                caracteristica("pequeno", 11L), caracteristica("medio", 9L), caracteristica("grande", 4L));
        when(animalRepository.contarPorEspecieComStatus("adotado")).thenReturn(porEspecie);
        when(animalRepository.contarPorPorteComStatus("adotado")).thenReturn(porPorte);

        RelatorioAdocoesResponse resposta = service.gerarPreview(PERIODO);

        assertThat(resposta.kpis().animaisAdotados()).isEqualTo(24);
        assertThat(resposta.perfil()).extracting("caracteristica", "quantidade", "percentual")
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple("Canino", 17L, 71), // 17/24 = 70.8% -> 71
                        org.assertj.core.groups.Tuple.tuple("Felino", 7L, 29),
                        org.assertj.core.groups.Tuple.tuple("Porte Pequeno", 11L, 46), // 11/24 = 45.8% -> 46
                        org.assertj.core.groups.Tuple.tuple("Porte Médio", 9L, 38),
                        org.assertj.core.groups.Tuple.tuple("Porte Grande", 4L, 17));
        assertThat(resposta.notaLimitacao()).contains("não é filtrado pelo período");
    }

    @Test
    void semAnimaisAdotadosDevolveListaVaziaSemDivisaoPorZero() {
        service = new RelatorioAdocoesService(animalRepository);

        when(animalRepository.countByStatus_Codigo("adotado")).thenReturn(0L);
        when(animalRepository.contarPorEspecieComStatus("adotado")).thenReturn(List.of());
        when(animalRepository.contarPorPorteComStatus("adotado")).thenReturn(List.of());

        RelatorioAdocoesResponse resposta = service.gerarPreview(PERIODO);

        assertThat(resposta.kpis().animaisAdotados()).isZero();
        assertThat(resposta.perfil()).isEmpty();
    }

    private ContagemPorCaracteristicaProjection caracteristica(String nome, long quantidade) {
        ContagemPorCaracteristicaProjection projecao = mock(ContagemPorCaracteristicaProjection.class);
        when(projecao.getCaracteristica()).thenReturn(nome);
        when(projecao.getQuantidade()).thenReturn(quantidade);
        return projecao;
    }
}
