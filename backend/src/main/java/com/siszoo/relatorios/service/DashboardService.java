package com.siszoo.relatorios.service;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.Year;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.siszoo.alertas.dto.AlertaVacinalAnimalResponse;
import com.siszoo.alertas.dto.SeveridadeAlerta;
import com.siszoo.alertas.service.AlertaVacinalService;
import com.siszoo.animais.clinico.entity.StatusPrescricao;
import com.siszoo.animais.clinico.entity.Vacinacao;
import com.siszoo.animais.clinico.repository.PrescricaoRepository;
import com.siszoo.animais.clinico.repository.VacinacaoRepository;
import com.siszoo.animais.dto.CatalogoItemResponse;
import com.siszoo.animais.entity.Baia;
import com.siszoo.animais.entity.Especie;
import com.siszoo.animais.entity.StatusAnimal;
import com.siszoo.animais.repository.AnimalRepository;
import com.siszoo.animais.repository.BaiaRepository;
import com.siszoo.animais.repository.ContagemPorEspecieProjection;
import com.siszoo.animais.repository.EspecieRepository;
import com.siszoo.animais.repository.OcupacaoBaiaProjection;
import com.siszoo.ocorrencias.repository.OcorrenciaRepository;
import com.siszoo.processos.entity.Doenca;
import com.siszoo.processos.repository.AnimalAmostradoRepository;
import com.siszoo.processos.repository.ContagemCatalogoProjection;
import com.siszoo.processos.repository.DoencaRepository;
import com.siszoo.processos.repository.ProcessoSanitarioRepository;
import com.siszoo.relatorios.dto.AlertaCriticoResponse;
import com.siszoo.relatorios.dto.CasoPorDoencaResponse;
import com.siszoo.relatorios.dto.CasoRaivaPorEspecieResponse;
import com.siszoo.relatorios.dto.DashboardGraficosResponse;
import com.siszoo.relatorios.dto.DashboardKpisResponse;
import com.siszoo.relatorios.dto.KpiAnimaisResponse;
import com.siszoo.relatorios.dto.KpiOcorrenciasResponse;
import com.siszoo.relatorios.dto.KpiVacinacaoResponse;
import com.siszoo.relatorios.dto.ResultadoPorDoencaResponse;

// DER §3.7: os 6 alertas criticos sao computados sob demanda, nunca
// persistidos. "Hoje"/"ano corrente" sempre via Clock (ClockConfig,
// America/Sao_Paulo) para o teste poder controlar a data. Cache de 5 min
// (CacheConfig) evita recalcular essas agregacoes a cada refresh do
// dashboard — ver docs/contratos/dashboard-kpis.md para o atraso que isso
// pode introduzir.
@Service
public class DashboardService {

    private static final int DIAS_ANTECEDENCIA_MEDICACAO = 7;
    private static final int DIAS_SEM_AVALIACAO = 30;
    private static final String STATUS_DISPONIVEL_ADOCAO = "disponivel_adocao";
    private static final String ESPECIE_CANINO = "canino";
    private static final String ESPECIE_FELINO = "felino";

    private final AnimalRepository animalRepository;
    private final VacinacaoRepository vacinacaoRepository;
    private final PrescricaoRepository prescricaoRepository;
    private final BaiaRepository baiaRepository;
    private final OcorrenciaRepository ocorrenciaRepository;
    private final ProcessoSanitarioRepository processoSanitarioRepository;
    private final AnimalAmostradoRepository animalAmostradoRepository;
    private final DoencaRepository doencaRepository;
    private final EspecieRepository especieRepository;
    private final AlertaVacinalService alertaVacinalService;
    private final Clock clock;

    public DashboardService(
            AnimalRepository animalRepository,
            VacinacaoRepository vacinacaoRepository,
            PrescricaoRepository prescricaoRepository,
            BaiaRepository baiaRepository,
            OcorrenciaRepository ocorrenciaRepository,
            ProcessoSanitarioRepository processoSanitarioRepository,
            AnimalAmostradoRepository animalAmostradoRepository,
            DoencaRepository doencaRepository,
            EspecieRepository especieRepository,
            AlertaVacinalService alertaVacinalService,
            Clock clock) {
        this.animalRepository = animalRepository;
        this.vacinacaoRepository = vacinacaoRepository;
        this.prescricaoRepository = prescricaoRepository;
        this.baiaRepository = baiaRepository;
        this.ocorrenciaRepository = ocorrenciaRepository;
        this.processoSanitarioRepository = processoSanitarioRepository;
        this.animalAmostradoRepository = animalAmostradoRepository;
        this.doencaRepository = doencaRepository;
        this.especieRepository = especieRepository;
        this.alertaVacinalService = alertaVacinalService;
        this.clock = clock;
    }

    @Cacheable("dashboardKpis")
    @Transactional(readOnly = true)
    public DashboardKpisResponse obterKpis() {
        LocalDate hoje = LocalDate.now(clock);
        Set<String> foraDaCustodia = StatusAnimal.CODIGOS_FORA_DA_CUSTODIA;

        KpiAnimaisResponse animais = calcularKpiAnimais(foraDaCustodia);
        KpiVacinacaoResponse vacinacao = calcularKpiVacinacao(foraDaCustodia, hoje, animais.total());
        KpiOcorrenciasResponse ocorrencias = calcularKpiOcorrencias(hoje);
        List<AlertaCriticoResponse> alertas = calcularAlertas(foraDaCustodia, hoje);

        return new DashboardKpisResponse(animais, vacinacao, ocorrencias, alertas);
    }

    @Cacheable("dashboardGraficos")
    @Transactional(readOnly = true)
    public DashboardGraficosResponse obterGraficos(Integer anoParam) {
        int ano = anoParam != null ? anoParam : Year.now(clock).getValue();

        List<Doenca> doencas = doencaRepository.findByAtivoTrueOrderByNomeAsc();
        List<Especie> especies = especieRepository.findAll();

        Map<String, Long> porDoenca = processoSanitarioRepository.contarPorDoenca(ano).stream()
                .collect(Collectors.toMap(
                        ContagemCatalogoProjection::getCodigo, ContagemCatalogoProjection::getQuantidade));
        List<CasoPorDoencaResponse> casosPorDoenca = doencas.stream()
                .map(d -> new CasoPorDoencaResponse(
                        new CatalogoItemResponse(d.getCodigo(), d.getNome()), porDoenca.getOrDefault(d.getCodigo(), 0L)))
                .toList();

        Map<String, Long> raivaPorEspecie = animalAmostradoRepository.contarRaivaPorEspecie(ano).stream()
                .collect(Collectors.toMap(
                        ContagemCatalogoProjection::getCodigo, ContagemCatalogoProjection::getQuantidade));
        List<CasoRaivaPorEspecieResponse> casosRaivaPorEspecie = especies.stream()
                .map(e -> new CasoRaivaPorEspecieResponse(
                        new CatalogoItemResponse(e.getCodigo(), e.getNome()),
                        raivaPorEspecie.getOrDefault(e.getCodigo(), 0L)))
                .toList();

        List<ResultadoPorDoencaResponse> resultadosPorDoenca =
                processoSanitarioRepository.contarResultadosPorDoenca(ano).stream()
                        .map(r -> new ResultadoPorDoencaResponse(
                                new CatalogoItemResponse(r.getCodigo(), r.getNome()), r.getPositivos(), r.getNegativos()))
                        .toList();

        return new DashboardGraficosResponse(casosPorDoenca, casosRaivaPorEspecie, resultadosPorDoenca);
    }

    private KpiAnimaisResponse calcularKpiAnimais(Set<String> foraDaCustodia) {
        Map<String, Long> porEspecie = animalRepository.contarSobCustodiaPorEspecie(foraDaCustodia).stream()
                .collect(Collectors.toMap(
                        ContagemPorEspecieProjection::getEspecieCodigo, ContagemPorEspecieProjection::getTotal));
        long total = porEspecie.values().stream().mapToLong(Long::longValue).sum();
        return new KpiAnimaisResponse(total, porEspecie.getOrDefault(ESPECIE_CANINO, 0L), porEspecie.getOrDefault(ESPECIE_FELINO, 0L));
    }

    // "Vacinado" (decisao de produto, sem conceito de protocolo no modelo):
    // animal sob custodia com ao menos uma vacinacao vigente cuja
    // dataValidade (dataAplicacao + vacina.intervaloMeses) ainda nao passou.
    private KpiVacinacaoResponse calcularKpiVacinacao(Set<String> foraDaCustodia, LocalDate hoje, long totalSobCustodia) {
        List<Vacinacao> vigentes = vacinacaoRepository.findVigentesSobCustodiaParaKpiVacinacao(foraDaCustodia);

        Set<UUID> animaisEmDia = new HashSet<>();
        for (Vacinacao vacinacao : vigentes) {
            LocalDate dataValidade = calcularDataValidade(vacinacao);
            if (!dataValidade.isBefore(hoje)) {
                animaisEmDia.add(vacinacao.getAnimal().getId());
            }
        }

        long vacinados = animaisEmDia.size();
        int percentual = totalSobCustodia == 0 ? 0 : (int) Math.round(vacinados * 100.0 / totalSobCustodia);
        return new KpiVacinacaoResponse(percentual, vacinados, totalSobCustodia);
    }

    // Mesma formula de AlertaVacinalService#calcularDataValidade /
    // VacinacaoMapper#calcularDataValidade.
    private LocalDate calcularDataValidade(Vacinacao vacinacao) {
        return vacinacao.getDataAplicacao().plusMonths(vacinacao.getVacina().getIntervaloMeses());
    }

    // Denominador de mediaPorHora = hora atual em America/Sao_Paulo (0-23),
    // mesmo criterio do calculo hoje no frontend (dashboardApi.ts::horaAtualEmSaoPaulo).
    // mediaPorHora omitido (null) na virada do dia (hora 0), para nao mostrar
    // uma media falsa de "X/0".
    private KpiOcorrenciasResponse calcularKpiOcorrencias(LocalDate hoje) {
        long registradasHoje = ocorrenciaRepository.contarRegistradasEm(hoje);
        int horasDecorridas = LocalTime.now(clock).getHour();
        Double mediaPorHora = horasDecorridas > 0
                ? Math.round((registradasHoje / (double) horasDecorridas) * 10) / 10.0
                : null;
        return new KpiOcorrenciasResponse(registradasHoje, mediaPorHora);
    }

    private List<AlertaCriticoResponse> calcularAlertas(Set<String> foraDaCustodia, LocalDate hoje) {
        List<AlertaCriticoResponse> alertas = new ArrayList<>();

        List<AlertaVacinalAnimalResponse> alertasVacinais = alertaVacinalService.listarAlertasVacinais();
        long vacinaVencendo = alertasVacinais.stream()
                .flatMap(a -> a.vacinas().stream())
                .filter(item -> item.severidade() == SeveridadeAlerta.A_VENCER)
                .count();
        long vacinaVencida = alertasVacinais.stream()
                .flatMap(a -> a.vacinas().stream())
                .filter(item -> item.severidade() == SeveridadeAlerta.VENCIDA)
                .count();
        alertas.add(new AlertaCriticoResponse(
                "vacina_vencendo", "atencao",
                vacinaVencendo + " vacina(s) vencendo em até 7 dias",
                "Reforços vacinais com vencimento nos próximos 7 dias.", vacinaVencendo));
        alertas.add(new AlertaCriticoResponse(
                "vacina_vencida", "critico",
                vacinaVencida + " vacina(s) vencida(s)",
                "Reforços vacinais já vencidos.", vacinaVencida));

        long semAvaliacao = animalRepository.countSemAvaliacaoDesde(foraDaCustodia, hoje.minusDays(DIAS_SEM_AVALIACAO));
        alertas.add(new AlertaCriticoResponse(
                "sem_avaliacao_30d", "atencao",
                semAvaliacao + " animal(is) sem avaliação clínica há mais de 30 dias",
                "Animais sob custódia sem procedimento registrado nos últimos 30 dias.", semAvaliacao));

        long baiaSuperlotada = contarBaiasSuperlotadas(foraDaCustodia);
        alertas.add(new AlertaCriticoResponse(
                "baia_superlotada", "critico",
                baiaSuperlotada + " baia(s) superlotada(s)",
                "Baias com ocupação igual ou acima da capacidade.", baiaSuperlotada));

        long medicacaoAtiva = prescricaoRepository.countByStatusAndDataFimPrevistaBetweenAndAnimal_Status_CodigoNotIn(
                StatusPrescricao.ATIVA, hoje, hoje.plusDays(DIAS_ANTECEDENCIA_MEDICACAO), foraDaCustodia);
        alertas.add(new AlertaCriticoResponse(
                "medicacao_ativa", "info",
                medicacaoAtiva + " prescrição(ões) ativa(s) terminando em até 7 dias",
                "Prescrições ativas com fim previsto nos próximos 7 dias.", medicacaoAtiva));

        long fichaIncompleta = animalRepository.countByFichaCompletaFalseAndStatus_CodigoNotIn(foraDaCustodia);
        alertas.add(new AlertaCriticoResponse(
                "ficha_incompleta", "info",
                fichaIncompleta + " animal(is) com ficha incompleta",
                "Animais sob custódia sem microchip e/ou sem vacinação vigente.", fichaIncompleta));

        long naoCastrado = animalRepository.countByEsterilizadoFalseAndStatus_Codigo(STATUS_DISPONIVEL_ADOCAO);
        alertas.add(new AlertaCriticoResponse(
                "nao_castrado", "info",
                naoCastrado + " animal(is) disponível(is) para adoção não castrado(s)",
                "Animais disponíveis para adoção que ainda não foram esterilizados.", naoCastrado));

        return alertas;
    }

    // Mesmo criterio de "superlotada" ja usado em
    // BaiaService#mapearComOcupacao (ocupacaoAtual >= capacidade).
    private long contarBaiasSuperlotadas(Set<String> foraDaCustodia) {
        List<Baia> baiasAtivas = baiaRepository.findByAtivaTrue();
        if (baiasAtivas.isEmpty()) {
            return 0;
        }
        List<UUID> ids = baiasAtivas.stream().map(Baia::getId).toList();
        Map<UUID, Long> ocupacaoPorBaia = animalRepository.contarOcupacaoPorBaia(ids, foraDaCustodia).stream()
                .collect(Collectors.toMap(OcupacaoBaiaProjection::getBaiaId, OcupacaoBaiaProjection::getTotal));

        return baiasAtivas.stream()
                .filter(baia -> ocupacaoPorBaia.getOrDefault(baia.getId(), 0L) >= baia.getCapacidade())
                .count();
    }
}
