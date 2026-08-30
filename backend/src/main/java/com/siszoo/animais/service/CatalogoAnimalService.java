package com.siszoo.animais.service;

import java.util.Comparator;
import java.util.List;
import java.util.function.Function;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.siszoo.animais.dto.CatalogoItemResponse;
import com.siszoo.animais.dto.CatalogosAnimalResponse;
import com.siszoo.animais.entity.Especie;
import com.siszoo.animais.entity.MotivoEntrada;
import com.siszoo.animais.entity.StatusAnimal;
import com.siszoo.animais.entity.TipoBaia;
import com.siszoo.animais.repository.EspecieRepository;
import com.siszoo.animais.repository.MotivoEntradaRepository;
import com.siszoo.animais.repository.StatusAnimalRepository;
import com.siszoo.animais.repository.TipoBaiaRepository;

@Service
public class CatalogoAnimalService {

    private final EspecieRepository especieRepository;
    private final StatusAnimalRepository statusAnimalRepository;
    private final MotivoEntradaRepository motivoEntradaRepository;
    private final TipoBaiaRepository tipoBaiaRepository;

    public CatalogoAnimalService(
            EspecieRepository especieRepository,
            StatusAnimalRepository statusAnimalRepository,
            MotivoEntradaRepository motivoEntradaRepository,
            TipoBaiaRepository tipoBaiaRepository) {
        this.especieRepository = especieRepository;
        this.statusAnimalRepository = statusAnimalRepository;
        this.motivoEntradaRepository = motivoEntradaRepository;
        this.tipoBaiaRepository = tipoBaiaRepository;
    }

    @Transactional(readOnly = true)
    public CatalogosAnimalResponse listar() {
        return new CatalogosAnimalResponse(
                mapear(especieRepository.findAll(), Especie::getCodigo, Especie::getNome),
                mapear(statusAnimalRepository.findAll(), StatusAnimal::getCodigo, StatusAnimal::getNome),
                mapear(motivoEntradaRepository.findAll(), MotivoEntrada::getCodigo, MotivoEntrada::getNome),
                mapear(tipoBaiaRepository.findAll(), TipoBaia::getCodigo, TipoBaia::getNome));
    }

    private <T> List<CatalogoItemResponse> mapear(List<T> entidades, Function<T, String> codigo, Function<T, String> nome) {
        return entidades.stream()
                .map(entidade -> new CatalogoItemResponse(codigo.apply(entidade), nome.apply(entidade)))
                .sorted(Comparator.comparing(CatalogoItemResponse::nome))
                .toList();
    }
}
