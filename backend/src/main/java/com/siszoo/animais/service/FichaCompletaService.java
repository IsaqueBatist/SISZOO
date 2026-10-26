package com.siszoo.animais.service;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.siszoo.animais.clinico.repository.VacinacaoRepository;
import com.siszoo.animais.entity.Animal;

// DER §3.2: ficha_completa = campos obrigatorios + microchip + ao menos uma
// vacinacao vigente. Os obrigatorios ja sao garantidos por Bean Validation no
// request e NOT NULL no schema. Fonte unica para o AnimalService (cadastro e
// edicao) e o VacinacaoService (nova vacinacao).
//
// A V18 (backfill) tem esta regra em SQL, mas e uma copia congelada: ja foi
// aplicada, nao roda de novo e nao pode ser editada (checksum do Flyway).
// Mudar a regra aqui exige uma migration nova que recalcule os dados
// existentes. Espelho que precisa acompanhar: fichaCompletaMock
// (frontend/src/mocks/handlers.ts). O seed de dados ficticios (com.siszoo.seed)
// passa por este service; SeedDevIT confere a ficha de animais semeados.
@Service
public class FichaCompletaService {

    private final VacinacaoRepository vacinacaoRepository;

    public FichaCompletaService(VacinacaoRepository vacinacaoRepository) {
        this.vacinacaoRepository = vacinacaoRepository;
    }

    public boolean calcular(Animal animal) {
        if (!StringUtils.hasText(animal.getMicrochip())) {
            return false;
        }
        // Animal ainda nao gravado nao tem vacinacao.
        return animal.getId() != null && vacinacaoRepository.existeVigenteDoAnimal(animal.getId());
    }
}
