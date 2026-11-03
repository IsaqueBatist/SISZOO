package com.siszoo.alertas.service;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.siszoo.alertas.dto.AlertaEsterilizacaoAnimalResponse;
import com.siszoo.animais.entity.Animal;
import com.siszoo.animais.entity.StatusAnimal;
import com.siszoo.animais.repository.AnimalRepository;

@Service
public class AlertaEsterilizacaoService {

    public static final int HORAS_A_DISPOSICAO_DO_RESPONSAVEL = 72;

    private final AnimalRepository animalRepository;
    private final Clock clock;

    public AlertaEsterilizacaoService(AnimalRepository animalRepository, Clock clock) {
        this.animalRepository = animalRepository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public List<AlertaEsterilizacaoAnimalResponse> listarAlertasEsterilizacao() {
        LocalDateTime agora = LocalDateTime.now(clock);
        return animalRepository.listarNaoEsterilizadosComEntradaAntesDe(
                        limiteDeEntrada(agora), StatusAnimal.CODIGOS_FORA_DA_CUSTODIA).stream()
                .map(animal -> paraResposta(animal, agora))
                .toList();
    }

    @Transactional(readOnly = true)
    public long contarAlertasEsterilizacao() {
        return animalRepository.countByEsterilizadoFalseAndDataEntradaBeforeAndStatus_CodigoNotIn(
                limiteDeEntrada(LocalDateTime.now(clock)), StatusAnimal.CODIGOS_FORA_DA_CUSTODIA);
    }

    private static LocalDateTime limiteDeEntrada(LocalDateTime agora) {
        return agora.minusHours(HORAS_A_DISPOSICAO_DO_RESPONSAVEL);
    }

    private static AlertaEsterilizacaoAnimalResponse paraResposta(Animal animal, LocalDateTime agora) {
        return new AlertaEsterilizacaoAnimalResponse(
                animal.getId(),
                animal.getNome(),
                animal.getMicrochip(),
                animal.getEspecie().getNome(),
                animal.getSexo(),
                animal.getBaia() == null ? null : animal.getBaia().getNome(),
                animal.getStatus().getNome(),
                animal.getDataEntrada(),
                ChronoUnit.HOURS.between(animal.getDataEntrada(), agora));
    }
}
