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

// Catalogo de apoio ao cadastro de medicamento (MedicamentoService exige uma
// categoria). Sem seed: as categorias reais sao cadastradas pelo CCZ. Mesmo
// padrao do medicamento: catalogo mutavel, sem auditoria.
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

    // O UNIQUE(nome) da V5 diferencia maiusculas; a pre-checagem nao, para
    // "Antibiotico" e "antibiotico" nao virarem duas categorias. Em corrida,
    // o UNIQUE do banco ainda barra a copia exata (409 generico).
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
