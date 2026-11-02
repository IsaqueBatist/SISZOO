package com.siszoo.animais.clinico.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.siszoo.animais.clinico.dto.CategoriaFarmacologicaResponse;
import com.siszoo.animais.clinico.dto.CriarCategoriaFarmacologicaRequest;
import com.siszoo.animais.clinico.entity.CategoriaFarmacologica;
import com.siszoo.animais.clinico.exception.CategoriaFarmacologicaJaCadastradaException;
import com.siszoo.animais.clinico.mapper.CategoriaFarmacologicaMapper;
import com.siszoo.animais.clinico.repository.CategoriaFarmacologicaRepository;

@Service
public class CategoriaFarmacologicaService {

    private final CategoriaFarmacologicaRepository categoriaFarmacologicaRepository;
    private final CategoriaFarmacologicaMapper categoriaFarmacologicaMapper;

    public CategoriaFarmacologicaService(
            CategoriaFarmacologicaRepository categoriaFarmacologicaRepository,
            CategoriaFarmacologicaMapper categoriaFarmacologicaMapper) {
        this.categoriaFarmacologicaRepository = categoriaFarmacologicaRepository;
        this.categoriaFarmacologicaMapper = categoriaFarmacologicaMapper;
    }

    @Transactional(readOnly = true)
    public List<CategoriaFarmacologicaResponse> listarAtivas() {
        return categoriaFarmacologicaRepository.findByAtivoTrueOrderByNomeAsc().stream()
                .map(categoriaFarmacologicaMapper::toResponse)
                .toList();
    }

    @Transactional
    public CategoriaFarmacologicaResponse criar(CriarCategoriaFarmacologicaRequest request) {
        String nome = request.nome().trim();
        if (categoriaFarmacologicaRepository.existsByNomeIgnoreCase(nome)) {
            throw new CategoriaFarmacologicaJaCadastradaException();
        }

        CategoriaFarmacologica categoria = new CategoriaFarmacologica();
        categoria.setNome(nome);
        categoriaFarmacologicaRepository.save(categoria);
        return categoriaFarmacologicaMapper.toResponse(categoria);
    }
}
