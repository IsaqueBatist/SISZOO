package com.siszoo.animais.clinico.service;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.siszoo.animais.clinico.dto.AtualizarVacinaRequest;
import com.siszoo.animais.clinico.dto.CriarVacinaRequest;
import com.siszoo.animais.clinico.dto.VacinaResponse;
import com.siszoo.animais.clinico.entity.Vacina;
import com.siszoo.animais.clinico.exception.VacinaJaCadastradaException;
import com.siszoo.animais.clinico.exception.VacinaNaoEncontradaException;
import com.siszoo.animais.clinico.mapper.VacinaMapper;
import com.siszoo.animais.clinico.repository.VacinaRepository;
import com.siszoo.comum.dto.PaginaResponse;
import com.siszoo.comum.exception.CampoInvalidoException;
import com.siszoo.comum.util.Paginacao;

import jakarta.persistence.criteria.Predicate;

@Service
public class VacinaService {

    private static final int TAMANHO_MAXIMO_CODIGO = 30;

    private final VacinaRepository vacinaRepository;
    private final VacinaMapper vacinaMapper;

    public VacinaService(VacinaRepository vacinaRepository, VacinaMapper vacinaMapper) {
        this.vacinaRepository = vacinaRepository;
        this.vacinaMapper = vacinaMapper;
    }

    @Transactional
    public VacinaResponse criar(CriarVacinaRequest request) {
        String nome = request.nome().trim();
        String codigo = derivarCodigo(nome);

        vacinaRepository.findByCodigo(codigo).ifPresent(existente -> {
            throw new VacinaJaCadastradaException(existente.getNome(), codigo, !existente.isAtivo());
        });

        Vacina vacina = new Vacina();
        vacina.setCodigo(codigo);
        vacina.setNome(nome);
        vacina.setIntervaloMeses(request.intervaloMeses());

        vacinaRepository.save(vacina);
        return vacinaMapper.toResponse(vacina);
    }

    @Transactional
    public VacinaResponse atualizar(UUID id, AtualizarVacinaRequest request) {
        Vacina vacina = vacinaRepository.findById(id).orElseThrow(VacinaNaoEncontradaException::new);

        vacina.setNome(request.nome().trim());
        vacina.setIntervaloMeses(request.intervaloMeses());
        vacina.setAtivo(request.ativo());

        vacinaRepository.save(vacina);
        return vacinaMapper.toResponse(vacina);
    }

    @Transactional
    public VacinaResponse desativar(UUID id) {
        Vacina vacina = vacinaRepository.findById(id).orElseThrow(VacinaNaoEncontradaException::new);
        vacina.setAtivo(false);
        vacinaRepository.save(vacina);
        return vacinaMapper.toResponse(vacina);
    }

    @Transactional(readOnly = true)
    public VacinaResponse buscarPorId(UUID id) {
        Vacina vacina = vacinaRepository.findById(id).orElseThrow(VacinaNaoEncontradaException::new);
        return vacinaMapper.toResponse(vacina);
    }

    @Transactional(readOnly = true)
    public PaginaResponse<VacinaResponse> listar(Boolean ativo, int pagina, int tamanho) {
        Specification<Vacina> filtro = construirFiltro(ativo);
        Page<Vacina> paginaVacinas = vacinaRepository.findAll(
                filtro, Paginacao.pagina(pagina, tamanho, Sort.by("nome").ascending()));

        return PaginaResponse.de(paginaVacinas.map(vacinaMapper::toResponse));
    }

    static String derivarCodigo(String nome) {
        String semAcento = Normalizer.normalize(nome, Normalizer.Form.NFD).replaceAll("\\p{M}+", "");
        String codigo = semAcento.toLowerCase()
                .replaceAll("[^a-z0-9]+", "_")
                .replaceAll("^_+|_+$", "");

        if (codigo.isEmpty()) {
            throw new CampoInvalidoException("nome", "O nome precisa conter letras ou números.");
        }
        if (codigo.length() > TAMANHO_MAXIMO_CODIGO) {
            throw new CampoInvalidoException("nome", "O nome é longo demais: use no máximo 30 letras ou números.");
        }
        return codigo;
    }

    private Specification<Vacina> construirFiltro(Boolean ativo) {
        return (root, query, cb) -> {
            List<Predicate> predicados = new ArrayList<>();
            if (ativo != null) {
                predicados.add(cb.equal(root.get("ativo"), ativo));
            }
            return cb.and(predicados.toArray(new Predicate[0]));
        };
    }
}
