package com.siszoo.alertas.service;

import java.time.Clock;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.siszoo.alertas.dto.AlertaVacinalAnimalResponse;
import com.siszoo.alertas.dto.AlertaVacinalItemResponse;
import com.siszoo.alertas.dto.SeveridadeAlerta;
import com.siszoo.alertas.mapper.AlertaVacinalMapper;
import com.siszoo.animais.clinico.entity.Vacinacao;
import com.siszoo.animais.clinico.repository.VacinacaoRepository;
import com.siszoo.animais.entity.Animal;

// Ponto de extensao: listarAlertasVacinais() nao depende de nada da camada
// HTTP, entao um futuro @Scheduled pode chama-la diretamente. Nao ha
// @EnableScheduling no projeto hoje, entao a anotacao nao foi adicionada.
@Service
public class AlertaVacinalService {

    private static final int DIAS_ANTECEDENCIA = 7;

    private final VacinacaoRepository vacinacaoRepository;
    private final AlertaVacinalMapper alertaVacinalMapper;
    private final Clock clock;

    public AlertaVacinalService(
            VacinacaoRepository vacinacaoRepository, AlertaVacinalMapper alertaVacinalMapper, Clock clock) {
        this.vacinacaoRepository = vacinacaoRepository;
        this.alertaVacinalMapper = alertaVacinalMapper;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<AlertaVacinalAnimalResponse> listarAlertasVacinais() {
        LocalDate hoje = LocalDate.now(clock);
        LocalDate limite = hoje.plusDays(DIAS_ANTECEDENCIA);

        // A exclusao de retificados e a escolha da aplicacao vigente de cada
        // par (animal, vacina) ja vem resolvida pela query (ver comentario em
        // VacinacaoRepository.findVigentesParaAlertaVacinal) — aqui so falta
        // calcular data_validade/dias restantes/severidade e filtrar a janela.
        List<Vacinacao> vigentes = vacinacaoRepository.findVigentesParaAlertaVacinal();
        if (vigentes.isEmpty()) {
            return List.of();
        }

        Map<Animal, List<AlertaVacinalItemResponse>> itensPorAnimal = new LinkedHashMap<>();
        vigentes.stream()
                .sorted(Comparator.comparing(Vacinacao::getDataAplicacao))
                .forEach(vacinacao -> {
                    LocalDate dataValidade = calcularDataValidade(vacinacao);
                    // Limite inclusivo por dia civil: dataValidade == hoje+7
                    // ainda entra no alerta (7 dias de antecedencia).
                    if (dataValidade.isAfter(limite)) {
                        return;
                    }
                    long diasRestantes = ChronoUnit.DAYS.between(hoje, dataValidade);
                    SeveridadeAlerta severidade =
                            dataValidade.isBefore(hoje) ? SeveridadeAlerta.VENCIDA : SeveridadeAlerta.A_VENCER;
                    AlertaVacinalItemResponse item =
                            alertaVacinalMapper.toItem(vacinacao, dataValidade, diasRestantes, severidade);
                    itensPorAnimal.computeIfAbsent(vacinacao.getAnimal(), a -> new ArrayList<>()).add(item);
                });

        return itensPorAnimal.entrySet().stream()
                .map(entry -> alertaVacinalMapper.toAnimalResponse(entry.getKey(), entry.getValue()))
                .toList();
    }

    // Mesma formula de com.siszoo.animais.clinico.mapper.VacinacaoMapper.calcularDataValidade.
    // Seguro sem checagem de nulo aqui: a query ja filtra vacina.intervaloMeses
    // != null, e dataAplicacao e coluna NOT NULL na entidade.
    private LocalDate calcularDataValidade(Vacinacao vacinacao) {
        return vacinacao.getDataAplicacao().plusMonths(vacinacao.getVacina().getIntervaloMeses());
    }
}
