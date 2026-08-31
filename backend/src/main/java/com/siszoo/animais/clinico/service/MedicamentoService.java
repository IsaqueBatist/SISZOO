package com.siszoo.animais.clinico.service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.siszoo.animais.clinico.dto.AtualizarMedicamentoRequest;
import com.siszoo.animais.clinico.dto.CriarMedicamentoRequest;
import com.siszoo.animais.clinico.dto.MedicamentoResponse;
import com.siszoo.animais.clinico.entity.CategoriaFarmacologica;
import com.siszoo.animais.clinico.entity.Medicamento;
import com.siszoo.animais.clinico.exception.CategoriaFarmacologicaInvalidaException;
import com.siszoo.animais.clinico.exception.MedicamentoNaoEncontradoException;
import com.siszoo.animais.clinico.mapper.MedicamentoMapper;
import com.siszoo.animais.clinico.repository.CategoriaFarmacologicaRepository;
import com.siszoo.animais.clinico.repository.MedicamentoRepository;
import com.siszoo.comum.dto.PaginaResponse;

import jakarta.persistence.criteria.Predicate;

// Catalogo (nao registro clinico): diferente de Vacinacao/Procedimento/Prescricao,
// medicamento e mutavel — editar e desativar aqui nao violam a regra de
// imutabilidade do CLAUDE.md, que vale so para os registros clinicos em si.
@Service
public class MedicamentoService {

    private final MedicamentoRepository medicamentoRepository;
    private final CategoriaFarmacologicaRepository categoriaFarmacologicaRepository;
    private final MedicamentoMapper medicamentoMapper;

    public MedicamentoService(
            MedicamentoRepository medicamentoRepository,
            CategoriaFarmacologicaRepository categoriaFarmacologicaRepository,
            MedicamentoMapper medicamentoMapper) {
        this.medicamentoRepository = medicamentoRepository;
        this.categoriaFarmacologicaRepository = categoriaFarmacologicaRepository;
        this.medicamentoMapper = medicamentoMapper;
    }

    @Transactional
    public MedicamentoResponse criar(CriarMedicamentoRequest request) {
        Medicamento medicamento = new Medicamento();
        medicamento.setNome(request.nome());
        medicamento.setCategoria(resolverCategoria(request.categoriaId()));

        medicamentoRepository.save(medicamento);
        return medicamentoMapper.toResponse(medicamento);
    }

    @Transactional
    public MedicamentoResponse atualizar(UUID id, AtualizarMedicamentoRequest request) {
        Medicamento medicamento = medicamentoRepository.findById(id)
                .orElseThrow(MedicamentoNaoEncontradoException::new);

        medicamento.setNome(request.nome());
        medicamento.setCategoria(resolverCategoria(request.categoriaId()));

        medicamentoRepository.save(medicamento);
        return medicamentoMapper.toResponse(medicamento);
    }

    // Soft-delete: nunca remove a linha fisicamente, so marca ativo=false
    // (mesmo padrao de BaiaService.desativar).
    @Transactional
    public MedicamentoResponse desativar(UUID id) {
        Medicamento medicamento = medicamentoRepository.findById(id)
                .orElseThrow(MedicamentoNaoEncontradoException::new);
        medicamento.setAtivo(false);
        medicamentoRepository.save(medicamento);
        return medicamentoMapper.toResponse(medicamento);
    }

    @Transactional(readOnly = true)
    public MedicamentoResponse buscarPorId(UUID id) {
        Medicamento medicamento = medicamentoRepository.findById(id)
                .orElseThrow(MedicamentoNaoEncontradoException::new);
        return medicamentoMapper.toResponse(medicamento);
    }

    @Transactional(readOnly = true)
    public PaginaResponse<MedicamentoResponse> listar(Boolean ativo, UUID categoriaId, int pagina, int tamanho) {
        Specification<Medicamento> filtro = construirFiltro(ativo, categoriaId);
        Page<Medicamento> paginaMedicamentos = medicamentoRepository.findAll(
                filtro, PageRequest.of(pagina, tamanho, Sort.by("nome").ascending()));

        return PaginaResponse.de(paginaMedicamentos.map(medicamentoMapper::toResponse));
    }

    private CategoriaFarmacologica resolverCategoria(UUID categoriaId) {
        return categoriaFarmacologicaRepository.findById(categoriaId)
                .orElseThrow(CategoriaFarmacologicaInvalidaException::new);
    }

    private Specification<Medicamento> construirFiltro(Boolean ativo, UUID categoriaId) {
        return (root, query, cb) -> {
            List<Predicate> predicados = new ArrayList<>();
            if (ativo != null) {
                predicados.add(cb.equal(root.get("ativo"), ativo));
            }
            if (categoriaId != null) {
                predicados.add(cb.equal(root.get("categoria").get("id"), categoriaId));
            }
            return cb.and(predicados.toArray(new Predicate[0]));
        };
    }
}
