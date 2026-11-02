package com.siszoo.animais.service;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import com.siszoo.animais.clinico.repository.VacinacaoRepository;
import com.siszoo.animais.entity.Animal;

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
        return animal.getId() != null && vacinacaoRepository.existeVigenteDoAnimal(animal.getId());
    }
}
