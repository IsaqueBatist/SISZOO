package com.siszoo.relatorios.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.siszoo.alertas.dto.AlertaVacinalAnimalResponse;
import com.siszoo.alertas.dto.AlertaVacinalItemResponse;
import com.siszoo.alertas.dto.SeveridadeAlerta;
import com.siszoo.alertas.service.AlertaVacinalService;
import com.siszoo.animais.clinico.entity.StatusPrescricao;
import com.siszoo.animais.clinico.entity.Vacina;
import com.siszoo.animais.clinico.entity.Vacinacao;
import com.siszoo.animais.clinico.repository.PrescricaoRepository;
import com.siszoo.animais.clinico.repository.VacinacaoRepository;
import com.siszoo.animais.entity.Animal;
import com.siszoo.animais.entity.Baia;
import com.siszoo.animais.entity.Especie;
import com.siszoo.animais.repository.AnimalRepository;
import com.siszoo.animais.repository.BaiaRepository;
import com.siszoo.animais.repository.ContagemPorEspecieProjection;
import com.siszoo.animais.repository.EspecieRepository;
import com.siszoo.animais.repository.OcupacaoBaiaProjection;
import com.siszoo.comum.config.ClockConfig;
import com.siszoo.comum.repository.ContagemCatalogoProjection;
import com.siszoo.ocorrencias.repository.OcorrenciaRepository;
import com.siszoo.processos.entity.Doenca;
import com.siszoo.processos.repository.AnimalAmostradoRepository;
import com.siszoo.processos.repository.DoencaRepository;
import com.siszoo.processos.repository.ProcessoSanitarioRepository;
import com.siszoo.processos.repository.ResultadoCatalogoProjection;
import com.siszoo.relatorios.dto.AlertaCriticoResponse;
import com.siszoo.relatorios.dto.DashboardGraficosResponse;
import com.siszoo.relatorios.dto.DashboardKpisResponse;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    private static final ZoneId FUSO = ZoneId.of("America/Sao_Paulo");
    // 2026-09-10 10:00 em Sao Paulo: horasDecorridas = 10 (>0), fora da virada
    // do dia, sem ambiguidade de fuso.
    private static final Clock CLOCK_10H = Clock.fixed(Instant.parse("2026-09-10T13:00:00Z"), FUSO);
    // Mesmo dia, 00:30 em Sao Paulo: horasDecorridas = 0 (virada do dia).
    private static final Clock CLOCK_00H = Clock.fixed(Instant.parse("2026-09-10T03:30:00Z"), FUSO);
    private static final LocalDate HOJE = LocalDate.of(2026, 9, 10);

    @Mock
    private AnimalRepository animalRepository;
    @Mock
    private VacinacaoRepository vacinacaoRepository;
    @Mock
    private PrescricaoRepository prescricaoRepository;
    @Mock
    private BaiaRepository baiaRepository;
    @Mock
    private OcorrenciaRepository ocorrenciaRepository;
    @Mock
    private ProcessoSanitarioRepository processoSanitarioRepository;
    @Mock
    private AnimalAmostradoRepository animalAmostradoRepository;
    @Mock
    private DoencaRepository doencaRepository;
    @Mock
    private EspecieRepository especieRepository;
    @Mock
    private AlertaVacinalService alertaVacinalService;

    private DashboardService service;

    @BeforeEach
    void setUp() {
        service = novoService(CLOCK_10H);
    }

    private DashboardService novoService(Clock clock) {
        return new DashboardService(
                animalRepository, vacinacaoRepository, prescricaoRepository, baiaRepository,
                ocorrenciaRepository, processoSanitarioRepository, animalAmostradoRepository,
                doencaRepository, especieRepository, alertaVacinalService, clock);
    }

    @Test
    void deveSomarAnimaisPorEspecieECalcularTotal() {
        List<ContagemPorEspecieProjection> contagens =
                List.of(contagemEspecie("canino", 5L), contagemEspecie("felino", 3L), contagemEspecie("quiroptero", 1L));
        when(animalRepository.contarSobCustodiaPorEspecie(anyCollection())).thenReturn(contagens);
        semVacinacaoVigente();
        semAlertas();

        DashboardKpisResponse resposta = service.obterKpis();

        assertThat(resposta.animais().total()).isEqualTo(9L);
        assertThat(resposta.animais().caninos()).isEqualTo(5L);
        assertThat(resposta.animais().felinos()).isEqualTo(3L);
    }

    @Test
    void deveDevolverZeroAnimaisQuandoNaoHaNenhumSobCustodia() {
        when(animalRepository.contarSobCustodiaPorEspecie(anyCollection())).thenReturn(List.of());
        semVacinacaoVigente();
        semAlertas();

        DashboardKpisResponse resposta = service.obterKpis();

        assertThat(resposta.animais().total()).isZero();
        assertThat(resposta.vacinacao().percentualVacinados()).isZero();
    }

    @Test
    void deveContarVacinadoComoApenasUmaVacinaVigenteNaoVencida() {
        ContagemPorEspecieProjection contagem = contagemEspecie("canino", 2L);
        when(animalRepository.contarSobCustodiaPorEspecie(anyCollection())).thenReturn(List.of(contagem));

        UUID animalEmDiaId = UUID.randomUUID();
        UUID animalVencidoId = UUID.randomUUID();
        Vacinacao vigenteNaoVencida = vacinacao(animalEmDiaId, HOJE.minusMonths(11), 12); // valida em HOJE+1 mes
        Vacinacao vigenteVencida = vacinacao(animalVencidoId, HOJE.minusMonths(13), 12); // validade HOJE-1 mes
        when(vacinacaoRepository.findVigentesSobCustodiaParaKpiVacinacao(anyCollection()))
                .thenReturn(List.of(vigenteNaoVencida, vigenteVencida));
        semAlertas();

        DashboardKpisResponse resposta = service.obterKpis();

        assertThat(resposta.vacinacao().vacinados()).isEqualTo(1L);
        assertThat(resposta.vacinacao().total()).isEqualTo(2L);
        assertThat(resposta.vacinacao().percentualVacinados()).isEqualTo(50);
    }

    @Test
    void deveArredondarPercentualDeVacinados() {
        ContagemPorEspecieProjection contagem = contagemEspecie("canino", 3L);
        when(animalRepository.contarSobCustodiaPorEspecie(anyCollection())).thenReturn(List.of(contagem));
        UUID animalId = UUID.randomUUID();
        Vacinacao vigente = vacinacao(animalId, HOJE, 12);
        when(vacinacaoRepository.findVigentesSobCustodiaParaKpiVacinacao(anyCollection())).thenReturn(List.of(vigente));
        semAlertas();

        DashboardKpisResponse resposta = service.obterKpis();

        // 1/3 = 33.33...% -> arredonda para 33.
        assertThat(resposta.vacinacao().percentualVacinados()).isEqualTo(33);
    }

    @Test
    void deveOmitirMediaPorHoraNaViradaDoDia() {
        service = novoService(CLOCK_00H);
        semKpisBasicos();
        semAlertas();
        when(ocorrenciaRepository.contarRegistradasEm(any())).thenReturn(0L);

        DashboardKpisResponse resposta = service.obterKpis();

        assertThat(resposta.ocorrencias().mediaPorHora()).isNull();
    }

    @Test
    void deveCalcularMediaPorHoraQuandoHaHorasDecorridas() {
        semKpisBasicos();
        semAlertas();
        when(ocorrenciaRepository.contarRegistradasEm(any())).thenReturn(5L);

        DashboardKpisResponse resposta = service.obterKpis();

        // 5 ocorrencias / 10h decorridas (CLOCK_10H) = 0.5.
        assertThat(resposta.ocorrencias().registradasHoje()).isEqualTo(5L);
        assertThat(resposta.ocorrencias().mediaPorHora()).isEqualTo(0.5);
    }

    @Test
    void deveContarAdocoesPeloStatusAtualDoAnimal() {
        semKpisBasicos();
        semAlertas();
        when(animalRepository.countByStatus_Codigo("adotado")).thenReturn(6L);
        when(animalRepository.countByStatus_Codigo("disponivel_adocao")).thenReturn(12L);

        DashboardKpisResponse resposta = service.obterKpis();

        assertThat(resposta.adocoes().adotados()).isEqualTo(6L);
        assertThat(resposta.adocoes().disponiveis()).isEqualTo(12L);
    }

    @Test
    void deveMontarOsSeteAlertasComTotaisDoDer37() {
        semKpisBasicos();

        AlertaVacinalItemResponse itemAVencer = itemVacinal(SeveridadeAlerta.A_VENCER);
        AlertaVacinalItemResponse itemVencido1 = itemVacinal(SeveridadeAlerta.VENCIDA);
        AlertaVacinalItemResponse itemVencido2 = itemVacinal(SeveridadeAlerta.VENCIDA);
        when(alertaVacinalService.listarAlertasVacinais()).thenReturn(List.of(
                new AlertaVacinalAnimalResponse(UUID.randomUUID(), "Rex", null, "Canino", "macho", null,
                        List.of(itemAVencer, itemVencido1, itemVencido2))));

        when(animalRepository.countSemAvaliacaoDesde(anyCollection(), any())).thenReturn(2L);
        when(baiaRepository.findByAtivaTrue()).thenReturn(List.of());
        when(prescricaoRepository.countByStatusAndDataFimPrevistaBetweenAndAnimal_Status_CodigoNotIn(
                eq(StatusPrescricao.ATIVA), any(), any(), anyCollection())).thenReturn(4L);
        when(animalRepository.countByFichaCompletaFalseAndStatus_CodigoNotIn(anyCollection())).thenReturn(1L);
        when(animalRepository.countByEsterilizadoFalseAndStatus_Codigo("disponivel_adocao")).thenReturn(3L);

        DashboardKpisResponse resposta = service.obterKpis();

        assertThat(resposta.alertas()).hasSize(7);
        assertThat(totalDoAlerta(resposta, "vacina_vencendo")).isEqualTo(1L);
        assertThat(totalDoAlerta(resposta, "vacina_vencida")).isEqualTo(2L);
        assertThat(totalDoAlerta(resposta, "sem_avaliacao_30d")).isEqualTo(2L);
        assertThat(totalDoAlerta(resposta, "baia_superlotada")).isEqualTo(0L);
        assertThat(totalDoAlerta(resposta, "medicacao_ativa")).isEqualTo(4L);
        assertThat(totalDoAlerta(resposta, "ficha_incompleta")).isEqualTo(1L);
        assertThat(totalDoAlerta(resposta, "nao_castrado")).isEqualTo(3L);
    }

    @Test
    void deveContarBaiaSuperlotadaQuandoOcupacaoIgualOuAcimaDaCapacidade() {
        semKpisBasicos();
        semAlertasVacinaisEOutros();

        UUID baiaCheiaId = UUID.randomUUID();
        UUID baiaLivreId = UUID.randomUUID();
        when(baiaRepository.findByAtivaTrue()).thenReturn(List.of(baia(baiaCheiaId, (short) 2), baia(baiaLivreId, (short) 5)));
        OcupacaoBaiaProjection ocupacaoCheia = ocupacao(baiaCheiaId, 2L);
        OcupacaoBaiaProjection ocupacaoLivre = ocupacao(baiaLivreId, 1L);
        when(animalRepository.contarOcupacaoPorBaia(anyCollection(), anyCollection()))
                .thenReturn(List.of(ocupacaoCheia, ocupacaoLivre));

        DashboardKpisResponse resposta = service.obterKpis();

        assertThat(totalDoAlerta(resposta, "baia_superlotada")).isEqualTo(1L);
    }

    @Test
    void deveZerarPorDoencaSempreComAsSeisDoCatalogoEOrdemDoRepositorio() {
        when(doencaRepository.findByAtivoTrueOrderByNomeAsc()).thenReturn(List.of(
                doenca("esporotricose", "Esporotricose"), doenca("raiva", "Raiva"),
                doenca("leishmaniose_visceral", "Leishmaniose Visceral"), doenca("leptospirose", "Leptospirose"),
                doenca("febre_maculosa", "Febre Maculosa"), doenca("febre_amarela", "Febre Amarela")));
        when(especieRepository.findAll()).thenReturn(List.of(
                especie("canino", "Canino"), especie("felino", "Felino"),
                especie("quiroptero", "Quiróptero"), especie("pnh", "Primata não-humano")));
        ContagemCatalogoProjection contagemRaiva = contagemCatalogo("raiva", 3L);
        when(processoSanitarioRepository.contarPorDoenca(anyInt())).thenReturn(List.of(contagemRaiva));
        when(animalAmostradoRepository.contarRaivaPorEspecie(anyInt())).thenReturn(List.of());
        when(processoSanitarioRepository.contarResultadosPorDoenca(anyInt())).thenReturn(List.of());

        DashboardGraficosResponse resposta = service.obterGraficos(2026);

        assertThat(resposta.casosPorDoenca()).hasSize(6);
        assertThat(resposta.casosPorDoenca()).filteredOn(c -> c.doenca().codigo().equals("raiva"))
                .extracting(c -> c.quantidade()).containsExactly(3L);
        assertThat(resposta.casosPorDoenca()).filteredOn(c -> c.doenca().codigo().equals("febre_amarela"))
                .extracting(c -> c.quantidade()).containsExactly(0L);

        assertThat(resposta.casosRaivaPorEspecie()).hasSize(4);
        assertThat(resposta.casosRaivaPorEspecie()).allMatch(c -> c.quantidade() == 0L);

        verify(processoSanitarioRepository).contarPorDoenca(2026);
    }

    @Test
    void naoDeveZerarResultadosPorDoencaPorqueEListeDinamica() {
        when(doencaRepository.findByAtivoTrueOrderByNomeAsc()).thenReturn(List.of());
        when(especieRepository.findAll()).thenReturn(List.of());
        when(processoSanitarioRepository.contarPorDoenca(anyInt())).thenReturn(List.of());
        when(animalAmostradoRepository.contarRaivaPorEspecie(anyInt())).thenReturn(List.of());
        ResultadoCatalogoProjection resultadoEsporotricose = resultadoCatalogo("esporotricose", "Esporotricose", 2L, 3L);
        when(processoSanitarioRepository.contarResultadosPorDoenca(anyInt())).thenReturn(List.of(resultadoEsporotricose));

        DashboardGraficosResponse resposta = service.obterGraficos(2026);

        assertThat(resposta.resultadosPorDoenca()).hasSize(1);
        assertThat(resposta.resultadosPorDoenca().get(0).positivos()).isEqualTo(2L);
        assertThat(resposta.resultadosPorDoenca().get(0).negativos()).isEqualTo(3L);
    }

    @Test
    void deveUsarAnoCorrenteQuandoParametroForNulo() {
        when(doencaRepository.findByAtivoTrueOrderByNomeAsc()).thenReturn(List.of());
        when(especieRepository.findAll()).thenReturn(List.of());
        when(processoSanitarioRepository.contarPorDoenca(anyInt())).thenReturn(List.of());
        when(animalAmostradoRepository.contarRaivaPorEspecie(anyInt())).thenReturn(List.of());
        when(processoSanitarioRepository.contarResultadosPorDoenca(anyInt())).thenReturn(List.of());

        service.obterGraficos(null);

        // CLOCK_10H esta fixo em 2026-09-10.
        verify(processoSanitarioRepository).contarPorDoenca(2026);
    }

    // Virada do dia UTC x Itu (FS-P7, mesmos instantes de
    // RegrasDeDataNaViradaDoDiaTest): o dia, a hora e as janelas do dashboard
    // sao os de Itu, com o fuso do Clock de producao (ClockConfig). As consultas
    // so comparam colunas de data com esses parametros (sem CURRENT_DATE).
    // registradasHoje = 42; mediaPorHora = 42 / hora de Itu (null a 0h).
    @ParameterizedTest(name = "{0}: hoje {2}, hora {3}")
    @CsvSource(nullValues = "nula", value = {
            "20:59 BRT, 2030-03-15T23:59:00Z, 2030-03-15, 20, 2.1",
            "21:00 BRT, 2030-03-16T00:00:00Z, 2030-03-15, 21, 2.0",
            "23:59 BRT, 2030-03-16T02:59:00Z, 2030-03-15, 23, 1.8",
            "00:00 BRT, 2030-03-16T03:00:00Z, 2030-03-16, 0, nula",
            "30/04 21:30 BRT, 2030-05-01T00:30:00Z, 2030-04-30, 21, 2.0",
            "31/12 21:30 BRT, 2031-01-01T00:30:00Z, 2030-12-31, 21, 2.0",
    })
    void kpisUsamODiaEAHoraDeItuNaViradaDoDia(String caso, String instante, String hoje, int hora, Double media) {
        service = novoService(Clock.fixed(Instant.parse(instante), new ClockConfig().clock().getZone()));
        LocalDate dia = LocalDate.parse(hoje);
        semKpisBasicos();
        semAlertas();
        when(ocorrenciaRepository.contarRegistradasEm(dia)).thenReturn(42L);

        DashboardKpisResponse resposta = service.obterKpis();

        assertThat(resposta.ocorrencias().registradasHoje()).isEqualTo(42L);
        assertThat(resposta.ocorrencias().mediaPorHora()).isEqualTo(media);
        verify(animalRepository).countSemAvaliacaoDesde(anyCollection(), eq(dia.minusDays(30)));
        verify(prescricaoRepository).countByStatusAndDataFimPrevistaBetweenAndAnimal_Status_CodigoNotIn(
                eq(StatusPrescricao.ATIVA), eq(dia), eq(dia.plusDays(7)), anyCollection());
    }

    // Graficos sem ano informado: o ano corrente e o de Itu, nao o de UTC.
    @ParameterizedTest(name = "{0} -> graficos de {2}")
    @CsvSource({
            "31/12 21:30 BRT, 2031-01-01T00:30:00Z, 2030",
            "31/12 23:59 BRT, 2031-01-01T02:59:00Z, 2030",
            "01/01 00:00 BRT, 2031-01-01T03:00:00Z, 2031",
    })
    void graficosUsamOAnoDeItu(String caso, String instante, int ano) {
        service = novoService(Clock.fixed(Instant.parse(instante), new ClockConfig().clock().getZone()));
        when(doencaRepository.findByAtivoTrueOrderByNomeAsc()).thenReturn(List.of());
        when(especieRepository.findAll()).thenReturn(List.of());
        when(processoSanitarioRepository.contarPorDoenca(anyInt())).thenReturn(List.of());
        when(animalAmostradoRepository.contarRaivaPorEspecie(anyInt())).thenReturn(List.of());
        when(processoSanitarioRepository.contarResultadosPorDoenca(anyInt())).thenReturn(List.of());

        service.obterGraficos(null);

        verify(processoSanitarioRepository).contarPorDoenca(ano);
        verify(animalAmostradoRepository).contarRaivaPorEspecie(ano);
        verify(processoSanitarioRepository).contarResultadosPorDoenca(ano);
    }

    private void semKpisBasicos() {
        when(animalRepository.contarSobCustodiaPorEspecie(anyCollection())).thenReturn(List.of());
        semVacinacaoVigente();
    }

    private void semVacinacaoVigente() {
        when(vacinacaoRepository.findVigentesSobCustodiaParaKpiVacinacao(anyCollection())).thenReturn(List.of());
    }

    private void semAlertas() {
        semAlertasVacinaisEOutros();
        when(baiaRepository.findByAtivaTrue()).thenReturn(List.of());
    }

    private void semAlertasVacinaisEOutros() {
        when(alertaVacinalService.listarAlertasVacinais()).thenReturn(List.of());
        when(animalRepository.countSemAvaliacaoDesde(anyCollection(), any())).thenReturn(0L);
        when(prescricaoRepository.countByStatusAndDataFimPrevistaBetweenAndAnimal_Status_CodigoNotIn(
                eq(StatusPrescricao.ATIVA), any(), any(), anyCollection())).thenReturn(0L);
        when(animalRepository.countByFichaCompletaFalseAndStatus_CodigoNotIn(anyCollection())).thenReturn(0L);
        when(animalRepository.countByEsterilizadoFalseAndStatus_Codigo(any())).thenReturn(0L);
        when(ocorrenciaRepository.contarRegistradasEm(any())).thenReturn(0L);
    }

    private long totalDoAlerta(DashboardKpisResponse resposta, String tipo) {
        return resposta.alertas().stream()
                .filter(a -> a.tipo().equals(tipo))
                .map(AlertaCriticoResponse::total)
                .findFirst()
                .orElseThrow(() -> new AssertionError("Alerta nao encontrado: " + tipo));
    }

    private ContagemPorEspecieProjection contagemEspecie(String codigo, long total) {
        ContagemPorEspecieProjection projecao = mock(ContagemPorEspecieProjection.class);
        when(projecao.getEspecieCodigo()).thenReturn(codigo);
        when(projecao.getTotal()).thenReturn(total);
        return projecao;
    }

    // getNome() nao e stubado: o service le codigo/quantidade desta projecao
    // (Collectors.toMap), e o nome exibido vem do catalogo
    // (DoencaRepository/EspecieRepository), nunca desta projecao.
    private ContagemCatalogoProjection contagemCatalogo(String codigo, long quantidade) {
        ContagemCatalogoProjection projecao = mock(ContagemCatalogoProjection.class);
        when(projecao.getCodigo()).thenReturn(codigo);
        when(projecao.getQuantidade()).thenReturn(quantidade);
        return projecao;
    }

    private ResultadoCatalogoProjection resultadoCatalogo(String codigo, String nome, long positivos, long negativos) {
        ResultadoCatalogoProjection projecao = mock(ResultadoCatalogoProjection.class);
        when(projecao.getCodigo()).thenReturn(codigo);
        when(projecao.getNome()).thenReturn(nome);
        when(projecao.getPositivos()).thenReturn(positivos);
        when(projecao.getNegativos()).thenReturn(negativos);
        return projecao;
    }

    private OcupacaoBaiaProjection ocupacao(UUID baiaId, long total) {
        OcupacaoBaiaProjection projecao = mock(OcupacaoBaiaProjection.class);
        when(projecao.getBaiaId()).thenReturn(baiaId);
        when(projecao.getTotal()).thenReturn(total);
        return projecao;
    }

    private Baia baia(UUID id, short capacidade) {
        Baia baia = new Baia();
        baia.setId(id);
        baia.setCapacidade(capacidade);
        return baia;
    }

    private Doenca doenca(String codigo, String nome) {
        Doenca doenca = new Doenca();
        doenca.setCodigo(codigo);
        doenca.setNome(nome);
        return doenca;
    }

    private Especie especie(String codigo, String nome) {
        Especie especie = new Especie();
        especie.setCodigo(codigo);
        especie.setNome(nome);
        return especie;
    }

    private Vacinacao vacinacao(UUID animalId, LocalDate dataAplicacao, int intervaloMeses) {
        Animal animal = new Animal();
        animal.setId(animalId);

        Vacina vacina = new Vacina();
        vacina.setIntervaloMeses(intervaloMeses);
        vacina.setAtivo(true);

        Vacinacao vacinacao = new Vacinacao();
        vacinacao.setAnimal(animal);
        vacinacao.setVacina(vacina);
        vacinacao.setDataAplicacao(dataAplicacao);
        vacinacao.setDoseQuantidade(new BigDecimal("1.000"));
        return vacinacao;
    }

    private AlertaVacinalItemResponse itemVacinal(SeveridadeAlerta severidade) {
        return new AlertaVacinalItemResponse(
                UUID.randomUUID(), UUID.randomUUID(), "Antirrabica", HOJE, HOJE, 0L, severidade, "Veterinario");
    }
}
