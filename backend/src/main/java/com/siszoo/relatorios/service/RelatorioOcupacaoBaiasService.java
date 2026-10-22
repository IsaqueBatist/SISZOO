package com.siszoo.relatorios.service;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.siszoo.animais.entity.Baia;
import com.siszoo.animais.entity.StatusAnimal;
import com.siszoo.animais.repository.AnimalRepository;
import com.siszoo.animais.repository.BaiaRepository;
import com.siszoo.animais.repository.OcupacaoBaiaProjection;
import com.siszoo.comum.util.BlocoCsv;
import com.siszoo.relatorios.dto.KpisOcupacaoBaiasResponse;
import com.siszoo.relatorios.dto.LinhaOcupacaoBaiaResponse;
import com.siszoo.relatorios.dto.PeriodoRelatorio;
import com.siszoo.relatorios.dto.RelatorioOcupacaoBaiasResponse;
import com.siszoo.relatorios.entity.TipoRelatorio;

// "Ocupação de Baias" (DER §3.6 / docs/prototipo/relatorio-ocupacao.html): o
// unico dos 6 tipos sem lista longa (numero de baias e pequeno e fixo), entao
// preview e CSV reaproveitam a mesma consulta — nao ha "top N + Outros" aqui.
// A ocupacao e sempre o estado ATUAL (mesma base de AlertaCriticoResponse
// "baia_superlotada" do dashboard): o filtro de periodo/janela da tela so
// rotula o cabecalho do relatorio, nao filtra uma janela historica (o schema
// nao guarda snapshot diario de ocupacao).
@Service
public class RelatorioOcupacaoBaiasService implements GeradorRelatorio<RelatorioOcupacaoBaiasResponse> {

    private static final List<String> CABECALHO_CSV = List.of("Baia", "Capacidade", "Atual", "% Ocupação", "Status");

    private final BaiaRepository baiaRepository;
    private final AnimalRepository animalRepository;

    public RelatorioOcupacaoBaiasService(BaiaRepository baiaRepository, AnimalRepository animalRepository) {
        this.baiaRepository = baiaRepository;
        this.animalRepository = animalRepository;
    }

    @Override
    public TipoRelatorio tipo() {
        return TipoRelatorio.OCUPACAO_BAIAS;
    }

    @Override
    @Transactional(readOnly = true)
    public RelatorioOcupacaoBaiasResponse gerarPreview(PeriodoRelatorio periodo) {
        List<LinhaOcupacaoBaiaResponse> linhas = montarLinhas();
        return new RelatorioOcupacaoBaiasResponse(periodo.inicio(), periodo.fim(), calcularKpis(linhas), linhas);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BlocoCsv> blocosCsv(PeriodoRelatorio periodo) {
        List<List<String>> linhas = montarLinhas().stream()
                .map(linha -> List.of(
                        linha.baia(),
                        String.valueOf(linha.capacidade()),
                        String.valueOf(linha.atual()),
                        linha.percentualOcupacao() + "%",
                        rotuloStatus(linha.status())))
                .toList();
        return List.of(new BlocoCsv("Ocupação atual por baia", CABECALHO_CSV, linhas));
    }

    // Mesma fonte de dados de DashboardService#contarBaiasSuperlotadas
    // (AnimalRepository#contarOcupacaoPorBaia): uma unica query agregada para
    // todas as baias, nunca uma por baia (evita N+1 em maquinas com ~2GB RAM).
    private List<LinhaOcupacaoBaiaResponse> montarLinhas() {
        List<Baia> baias = baiaRepository.findByAtivaTrueOrderByNomeAsc();
        if (baias.isEmpty()) {
            return List.of();
        }
        List<UUID> ids = baias.stream().map(Baia::getId).toList();
        Map<UUID, Long> ocupacaoPorBaia = animalRepository
                .contarOcupacaoPorBaia(ids, StatusAnimal.CODIGOS_FORA_DA_CUSTODIA).stream()
                .collect(Collectors.toMap(OcupacaoBaiaProjection::getBaiaId, OcupacaoBaiaProjection::getTotal));

        return baias.stream()
                .map(baia -> {
                    long atual = ocupacaoPorBaia.getOrDefault(baia.getId(), 0L);
                    int capacidade = baia.getCapacidade();
                    int percentual = capacidade == 0 ? 0 : (int) Math.round(atual * 100.0 / capacidade);
                    String status = atual > capacidade ? "superlotada" : atual == capacidade ? "proximo_limite" : "normal";
                    return new LinhaOcupacaoBaiaResponse(baia.getNome(), capacidade, atual, percentual, status);
                })
                .toList();
    }

    private KpisOcupacaoBaiasResponse calcularKpis(List<LinhaOcupacaoBaiaResponse> linhas) {
        long capacidadeTotal = linhas.stream().mapToLong(LinhaOcupacaoBaiaResponse::capacidade).sum();
        long atualTotal = linhas.stream().mapToLong(LinhaOcupacaoBaiaResponse::atual).sum();
        int ocupacaoMedia = capacidadeTotal == 0 ? 0 : (int) Math.round(atualTotal * 100.0 / capacidadeTotal);
        long superlotadas = linhas.stream().filter(linha -> "superlotada".equals(linha.status())).count();
        long noLimite = linhas.stream().filter(linha -> "proximo_limite".equals(linha.status())).count();
        return new KpisOcupacaoBaiasResponse(ocupacaoMedia, superlotadas, noLimite, (int) capacidadeTotal);
    }

    private String rotuloStatus(String status) {
        return switch (status) {
            case "superlotada" -> "Superlotada";
            case "proximo_limite" -> "Próx. limite";
            default -> "Normal";
        };
    }
}
