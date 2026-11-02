package com.siszoo.relatorios.service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.siszoo.animais.repository.AnimalRepository;
import com.siszoo.animais.repository.ContagemPorCaracteristicaProjection;
import com.siszoo.comum.util.BlocoCsv;
import com.siszoo.comum.util.Formatadores;
import com.siszoo.relatorios.dto.KpisAdocoesResponse;
import com.siszoo.relatorios.dto.PeriodoRelatorio;
import com.siszoo.relatorios.dto.PerfilAdocaoResponse;
import com.siszoo.relatorios.dto.RelatorioAdocoesResponse;
import com.siszoo.relatorios.entity.TipoRelatorio;

@Service
public class RelatorioAdocoesService implements GeradorRelatorio<RelatorioAdocoesResponse> {

    private static final String STATUS_ADOTADO = "adotado";
    private static final Map<String, String> ROTULO_PORTE = Map.of(
            "pequeno", "Porte Pequeno", "medio", "Porte Médio", "grande", "Porte Grande");
    private static final String NOTA_LIMITACAO =
            "Posição em %s: quantidade de animais com status \"Adotado\" nessa data e seu perfil por "
                    + "espécie/porte. Não é um histórico por período: o sistema ainda não registra a "
                    + "data em que a adoção ocorreu, dados do adotante, nem devoluções (não há tabela de adoção "
                    + "implementada); por isso \"Adoções realizadas no período\", \"Tempo médio\", \"Devoluções\" "
                    + "e \"Últimas adoções\" do modelo original deste relatório não estão disponíveis.";

    private final AnimalRepository animalRepository;

    public RelatorioAdocoesService(AnimalRepository animalRepository) {
        this.animalRepository = animalRepository;
    }

    @Override
    public TipoRelatorio tipo() {
        return TipoRelatorio.ADOCOES;
    }

    @Override
    @Transactional(readOnly = true)
    public RelatorioAdocoesResponse gerarPreview(PeriodoRelatorio periodo) {
        long animaisAdotados = animalRepository.countByStatus_Codigo(STATUS_ADOTADO);
        List<PerfilAdocaoResponse> perfil = montarPerfil(animaisAdotados);
        return new RelatorioAdocoesResponse(
                periodo.inicio(), periodo.fim(), new KpisAdocoesResponse(animaisAdotados), perfil,
                NOTA_LIMITACAO.formatted(Formatadores.DATA.format(periodo.inicio())));
    }

    @Override
    @Transactional(readOnly = true)
    public List<BlocoCsv> blocosCsv(PeriodoRelatorio periodo) {
        long animaisAdotados = animalRepository.countByStatus_Codigo(STATUS_ADOTADO);
        List<List<String>> linhas = montarPerfil(animaisAdotados).stream()
                .map(l -> List.of(l.caracteristica(), String.valueOf(l.quantidade()), l.percentual() + "%"))
                .toList();
        return List.of(new BlocoCsv("Perfil dos animais adotados - Posição em " + Formatadores.DATA.format(periodo.inicio()),
                List.of("Característica", "Quantidade", "% do total"), linhas));
    }

    private List<PerfilAdocaoResponse> montarPerfil(long animaisAdotados) {
        Map<String, Long> porEspecie = new LinkedHashMap<>();
        for (ContagemPorCaracteristicaProjection linha : animalRepository.contarPorEspecieComStatus(STATUS_ADOTADO)) {
            porEspecie.put(linha.getCaracteristica(), linha.getQuantidade());
        }
        Map<String, Long> porPorte = new LinkedHashMap<>();
        for (ContagemPorCaracteristicaProjection linha : animalRepository.contarPorPorteComStatus(STATUS_ADOTADO)) {
            String rotulo = ROTULO_PORTE.get(linha.getCaracteristica());
            if (rotulo != null) {
                porPorte.put(rotulo, linha.getQuantidade());
            }
        }

        List<PerfilAdocaoResponse> resultado = new java.util.ArrayList<>();
        porEspecie.forEach((nome, quantidade) -> resultado.add(novaLinha(nome, quantidade, animaisAdotados)));
        porPorte.forEach((rotulo, quantidade) -> resultado.add(novaLinha(rotulo, quantidade, animaisAdotados)));
        return resultado;
    }

    private PerfilAdocaoResponse novaLinha(String caracteristica, long quantidade, long total) {
        int percentual = total == 0 ? 0 : (int) Math.round(quantidade * 100.0 / total);
        return new PerfilAdocaoResponse(caracteristica, quantidade, percentual);
    }
}
