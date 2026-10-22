package com.siszoo.relatorios.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.siszoo.animais.entity.Baia;
import com.siszoo.animais.repository.AnimalRepository;
import com.siszoo.animais.repository.BaiaRepository;
import com.siszoo.animais.repository.OcupacaoBaiaProjection;
import com.siszoo.comum.util.BlocoCsv;
import com.siszoo.relatorios.dto.LinhaOcupacaoBaiaResponse;
import com.siszoo.relatorios.dto.PeriodoRelatorio;
import com.siszoo.relatorios.dto.RelatorioOcupacaoBaiasResponse;

// "Ocupação de Baias" (T41): atual > capacidade = superlotada; atual ==
// capacidade = proximo_limite (nao superlotada) — mesmo criterio do
// protótipo (docs/prototipo/relatorio-ocupacao.html: Baia 6 a 100% e
// "Próx. limite", só Baia 3 a 133% é "SUPERLOTADA").
@ExtendWith(MockitoExtension.class)
class RelatorioOcupacaoBaiasServiceTest {

    private static final PeriodoRelatorio PERIODO = new PeriodoRelatorio(LocalDate.of(2026, 1, 1), LocalDate.of(2026, 6, 30));

    @Mock
    private BaiaRepository baiaRepository;
    @Mock
    private AnimalRepository animalRepository;

    private RelatorioOcupacaoBaiasService service;

    @Test
    void deveClassificarStatusEComputarKpis() {
        service = new RelatorioOcupacaoBaiasService(baiaRepository, animalRepository);

        UUID idNormal = UUID.randomUUID();
        UUID idLimite = UUID.randomUUID();
        UUID idSuperlotada = UUID.randomUUID();
        Baia normal = baia(idNormal, "Baia 1", (short) 6);
        Baia noLimite = baia(idLimite, "Baia 6", (short) 6);
        Baia superlotada = baia(idSuperlotada, "Baia 3", (short) 6);

        when(baiaRepository.findByAtivaTrueOrderByNomeAsc()).thenReturn(List.of(normal, noLimite, superlotada));
        // Mocks das projeções precisam estar prontos ANTES do when/thenReturn
        // abaixo — criar mock() dentro dos argumentos de um thenReturn em
        // andamento confunde o estado interno do Mockito (UnfinishedStubbingException).
        List<OcupacaoBaiaProjection> ocupacoes = List.of(ocupacao(idNormal, 3L), ocupacao(idLimite, 6L), ocupacao(idSuperlotada, 8L));
        when(animalRepository.contarOcupacaoPorBaia(
                List.of(idNormal, idLimite, idSuperlotada), com.siszoo.animais.entity.StatusAnimal.CODIGOS_FORA_DA_CUSTODIA))
                .thenReturn(ocupacoes);

        RelatorioOcupacaoBaiasResponse resposta = service.gerarPreview(PERIODO);

        assertThat(resposta.baias()).extracting(LinhaOcupacaoBaiaResponse::status)
                .containsExactly("normal", "proximo_limite", "superlotada");
        assertThat(resposta.kpis().baiasSuperlotadas()).isEqualTo(1);
        assertThat(resposta.kpis().baiasNoLimite()).isEqualTo(1);
        assertThat(resposta.kpis().capacidadeTotal()).isEqualTo(18);
        // (3+6+8)/18 = 94,4% -> arredonda para 94%
        assertThat(resposta.kpis().ocupacaoMediaPercentual()).isEqualTo(94);
    }

    @Test
    void semBaiasAtivasDevolveListaVaziaEKpisZerados() {
        service = new RelatorioOcupacaoBaiasService(baiaRepository, animalRepository);
        when(baiaRepository.findByAtivaTrueOrderByNomeAsc()).thenReturn(List.of());

        RelatorioOcupacaoBaiasResponse resposta = service.gerarPreview(PERIODO);

        assertThat(resposta.baias()).isEmpty();
        assertThat(resposta.kpis().capacidadeTotal()).isZero();
        assertThat(resposta.kpis().ocupacaoMediaPercentual()).isZero();
    }

    @Test
    void blocosCsvTraduzStatusParaRotuloPtBr() {
        service = new RelatorioOcupacaoBaiasService(baiaRepository, animalRepository);
        UUID id = UUID.randomUUID();
        Baia superlotada = baia(id, "Baia 3", (short) 6);
        when(baiaRepository.findByAtivaTrueOrderByNomeAsc()).thenReturn(List.of(superlotada));
        List<OcupacaoBaiaProjection> ocupacoes = List.of(ocupacao(id, 8L));
        when(animalRepository.contarOcupacaoPorBaia(List.of(id), com.siszoo.animais.entity.StatusAnimal.CODIGOS_FORA_DA_CUSTODIA))
                .thenReturn(ocupacoes);

        List<BlocoCsv> blocos = service.blocosCsv(PERIODO);

        assertThat(blocos).hasSize(1);
        assertThat(blocos.get(0).titulo()).isEqualTo("Ocupação atual por baia");
        assertThat(blocos.get(0).linhas()).containsExactly(List.of("Baia 3", "6", "8", "133%", "Superlotada"));
    }

    private Baia baia(UUID id, String nome, short capacidade) {
        Baia baia = new Baia();
        baia.setId(id);
        baia.setNome(nome);
        baia.setCapacidade(capacidade);
        return baia;
    }

    private OcupacaoBaiaProjection ocupacao(UUID baiaId, long total) {
        OcupacaoBaiaProjection projecao = mock(OcupacaoBaiaProjection.class);
        when(projecao.getBaiaId()).thenReturn(baiaId);
        when(projecao.getTotal()).thenReturn(total);
        return projecao;
    }
}
