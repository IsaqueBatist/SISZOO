package com.siszoo.animais.clinico.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.siszoo.animais.clinico.dto.CriarVacinacaoRequest;
import com.siszoo.animais.clinico.dto.VacinacaoResponse;
import com.siszoo.animais.clinico.entity.Vacina;
import com.siszoo.animais.clinico.entity.Vacinacao;
import com.siszoo.animais.clinico.exception.RegistroJaRetificadoException;
import com.siszoo.animais.clinico.exception.RetificacaoAnimalDivergenteException;
import com.siszoo.animais.clinico.exception.VacinaInvalidaException;
import com.siszoo.animais.clinico.exception.VacinacaoNaoEncontradaException;
import com.siszoo.animais.clinico.mapper.VacinacaoMapper;
import com.siszoo.animais.clinico.repository.VacinaRepository;
import com.siszoo.animais.clinico.repository.VacinacaoRepository;
import com.siszoo.animais.entity.Animal;
import com.siszoo.animais.exception.AnimalNaoEncontradoException;
import com.siszoo.animais.repository.AnimalRepository;
import com.siszoo.comum.dto.PaginaResponse;
import com.siszoo.usuarios.entity.AcaoAuditoria;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.exception.UsuarioNaoEncontradoException;
import com.siszoo.usuarios.repository.UsuarioRepository;
import com.siszoo.usuarios.service.AuditoriaEventoService;

import jakarta.persistence.criteria.Predicate;

// Sem metodo atualizar/excluir: registro clinico imutavel (CLAUDE.md).
// Correcao = novo POST com `retificaId` apontando para o registro anterior
// (ver validarRetificacao). Ver RegistrosClinicosSemMutacaoTest.
@Service
public class VacinacaoService {

    private final VacinacaoRepository vacinacaoRepository;
    private final VacinaRepository vacinaRepository;
    private final AnimalRepository animalRepository;
    private final UsuarioRepository usuarioRepository;
    private final VacinacaoMapper vacinacaoMapper;
    private final AuditoriaEventoService auditoriaEventoService;

    public VacinacaoService(
            VacinacaoRepository vacinacaoRepository,
            VacinaRepository vacinaRepository,
            AnimalRepository animalRepository,
            UsuarioRepository usuarioRepository,
            VacinacaoMapper vacinacaoMapper,
            AuditoriaEventoService auditoriaEventoService) {
        this.vacinacaoRepository = vacinacaoRepository;
        this.vacinaRepository = vacinaRepository;
        this.animalRepository = animalRepository;
        this.usuarioRepository = usuarioRepository;
        this.vacinacaoMapper = vacinacaoMapper;
        this.auditoriaEventoService = auditoriaEventoService;
    }

    @Transactional
    public VacinacaoResponse criar(CriarVacinacaoRequest request, UUID usuarioAutenticadoId) {
        Animal animal = animalRepository.findById(request.animalId())
                .orElseThrow(AnimalNaoEncontradoException::new);
        Usuario usuarioAutenticado = usuarioRepository.findById(usuarioAutenticadoId)
                .orElseThrow(UsuarioNaoEncontradoException::new);

        Vacinacao anterior = request.retificaId() != null
                ? validarRetificacao(request.retificaId(), animal.getId())
                : null;

        Vacinacao vacinacao = new Vacinacao();
        vacinacao.setAnimal(animal);
        vacinacao.setVacina(resolverVacina(request.vacina()));
        vacinacao.setAplicadoPor(usuarioAutenticado);
        vacinacao.setDataAplicacao(request.dataAplicacao());
        vacinacao.setNumeroDose(request.numeroDose());
        vacinacao.setDoseQuantidade(request.doseQuantidade());
        vacinacao.setDoseUnidade(request.doseUnidade());
        vacinacao.setLote(request.lote());
        vacinacao.setObservacoes(request.observacoes());
        vacinacao.setRetifica(anterior);

        vacinacaoRepository.save(vacinacao);
        VacinacaoResponse response = vacinacaoMapper.toResponse(vacinacao, null);

        if (anterior != null) {
            auditoriaEventoService.registrar(usuarioAutenticado, AcaoAuditoria.ATUALIZACAO, "vacinacao",
                    vacinacaoMapper.toResponse(anterior, null), response);
        } else {
            auditoriaEventoService.registrar(usuarioAutenticado, AcaoAuditoria.CRIACAO, "vacinacao", null, response);
        }

        return response;
    }

    @Transactional(readOnly = true)
    public VacinacaoResponse buscarPorId(UUID id) {
        Vacinacao vacinacao = vacinacaoRepository.findById(id).orElseThrow(VacinacaoNaoEncontradaException::new);
        UUID retificadoPorId = vacinacaoRepository.findByRetificaId(id).map(Vacinacao::getId).orElse(null);
        return vacinacaoMapper.toResponse(vacinacao, retificadoPorId);
    }

    @Transactional(readOnly = true)
    public PaginaResponse<VacinacaoResponse> listar(UUID animalId, int pagina, int tamanho) {
        Specification<Vacinacao> filtro = construirFiltro(animalId);
        Page<Vacinacao> paginaVacinacoes = vacinacaoRepository.findAll(
                filtro, PageRequest.of(pagina, tamanho, Sort.by("dataAplicacao").descending()));

        List<UUID> ids = paginaVacinacoes.getContent().stream().map(Vacinacao::getId).toList();
        Map<UUID, UUID> retificadoPorPorId = ids.isEmpty()
                ? Map.of()
                : vacinacaoRepository.findByRetificaIdIn(ids).stream()
                        .collect(Collectors.toMap(v -> v.getRetifica().getId(), Vacinacao::getId));

        List<VacinacaoResponse> itens = paginaVacinacoes.getContent().stream()
                .map(v -> vacinacaoMapper.toResponse(v, retificadoPorPorId.get(v.getId())))
                .toList();

        return new PaginaResponse<>(
                itens,
                paginaVacinacoes.getNumber(),
                paginaVacinacoes.getSize(),
                paginaVacinacoes.getTotalElements(),
                paginaVacinacoes.getTotalPages());
    }

    private Vacinacao validarRetificacao(UUID retificaId, UUID animalId) {
        Vacinacao anterior = vacinacaoRepository.findById(retificaId)
                .orElseThrow(VacinacaoNaoEncontradaException::new);
        if (!anterior.getAnimal().getId().equals(animalId)) {
            throw new RetificacaoAnimalDivergenteException();
        }
        if (vacinacaoRepository.existsByRetificaId(retificaId)) {
            throw new RegistroJaRetificadoException();
        }
        return anterior;
    }

    private Vacina resolverVacina(String codigo) {
        return vacinaRepository.findByCodigo(codigo).orElseThrow(VacinaInvalidaException::new);
    }

    private Specification<Vacinacao> construirFiltro(UUID animalId) {
        return (root, query, cb) -> {
            List<Predicate> predicados = new ArrayList<>();
            if (animalId != null) {
                predicados.add(cb.equal(root.get("animal").get("id"), animalId));
            }
            return cb.and(predicados.toArray(new Predicate[0]));
        };
    }
}
