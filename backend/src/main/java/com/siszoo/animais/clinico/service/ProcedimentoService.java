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

import com.siszoo.animais.clinico.dto.CriarProcedimentoRequest;
import com.siszoo.animais.clinico.dto.ProcedimentoResponse;
import com.siszoo.animais.clinico.entity.Procedimento;
import com.siszoo.animais.clinico.entity.TipoProcedimento;
import com.siszoo.animais.clinico.exception.ProcedimentoNaoEncontradoException;
import com.siszoo.animais.clinico.exception.RegistroJaRetificadoException;
import com.siszoo.animais.clinico.exception.RetificacaoAnimalDivergenteException;
import com.siszoo.animais.clinico.exception.TipoProcedimentoInvalidoException;
import com.siszoo.animais.clinico.mapper.ProcedimentoMapper;
import com.siszoo.animais.clinico.repository.ProcedimentoRepository;
import com.siszoo.animais.clinico.repository.TipoProcedimentoRepository;
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

// Sem metodo atualizar/excluir: registro clinico imutavel (CLAUDE.md). Ver
// VacinacaoService para o mecanismo de retificacao.
@Service
public class ProcedimentoService {

    private final ProcedimentoRepository procedimentoRepository;
    private final TipoProcedimentoRepository tipoProcedimentoRepository;
    private final AnimalRepository animalRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProcedimentoMapper procedimentoMapper;
    private final AuditoriaEventoService auditoriaEventoService;

    public ProcedimentoService(
            ProcedimentoRepository procedimentoRepository,
            TipoProcedimentoRepository tipoProcedimentoRepository,
            AnimalRepository animalRepository,
            UsuarioRepository usuarioRepository,
            ProcedimentoMapper procedimentoMapper,
            AuditoriaEventoService auditoriaEventoService) {
        this.procedimentoRepository = procedimentoRepository;
        this.tipoProcedimentoRepository = tipoProcedimentoRepository;
        this.animalRepository = animalRepository;
        this.usuarioRepository = usuarioRepository;
        this.procedimentoMapper = procedimentoMapper;
        this.auditoriaEventoService = auditoriaEventoService;
    }

    @Transactional
    public ProcedimentoResponse criar(CriarProcedimentoRequest request, UUID usuarioAutenticadoId) {
        Animal animal = animalRepository.findById(request.animalId())
                .orElseThrow(AnimalNaoEncontradoException::new);
        Usuario usuarioAutenticado = usuarioRepository.findById(usuarioAutenticadoId)
                .orElseThrow(UsuarioNaoEncontradoException::new);

        Procedimento anterior = request.retificaId() != null
                ? validarRetificacao(request.retificaId(), animal.getId())
                : null;

        Procedimento procedimento = new Procedimento();
        procedimento.setAnimal(animal);
        procedimento.setTipoProcedimento(resolverTipoProcedimento(request.tipoProcedimento()));
        procedimento.setExecutadoPor(usuarioAutenticado);
        procedimento.setData(request.data());
        procedimento.setDescricao(request.descricao());
        procedimento.setResultado(request.resultado());
        procedimento.setRetifica(anterior);

        procedimentoRepository.save(procedimento);
        ProcedimentoResponse response = procedimentoMapper.toResponse(procedimento, null);

        if (anterior != null) {
            auditoriaEventoService.registrar(usuarioAutenticado, AcaoAuditoria.ATUALIZACAO, "procedimento",
                    procedimentoMapper.toResponse(anterior, null), response);
        } else {
            auditoriaEventoService.registrar(usuarioAutenticado, AcaoAuditoria.CRIACAO, "procedimento", null, response);
        }

        return response;
    }

    @Transactional(readOnly = true)
    public ProcedimentoResponse buscarPorId(UUID id) {
        Procedimento procedimento = procedimentoRepository.findById(id)
                .orElseThrow(ProcedimentoNaoEncontradoException::new);
        UUID retificadoPorId = procedimentoRepository.findByRetificaId(id).map(Procedimento::getId).orElse(null);
        return procedimentoMapper.toResponse(procedimento, retificadoPorId);
    }

    @Transactional(readOnly = true)
    public PaginaResponse<ProcedimentoResponse> listar(UUID animalId, int pagina, int tamanho) {
        Specification<Procedimento> filtro = construirFiltro(animalId);
        Page<Procedimento> paginaProcedimentos = procedimentoRepository.findAll(
                filtro, PageRequest.of(pagina, tamanho, Sort.by("data").descending()));

        List<UUID> ids = paginaProcedimentos.getContent().stream().map(Procedimento::getId).toList();
        Map<UUID, UUID> retificadoPorPorId = ids.isEmpty()
                ? Map.of()
                : procedimentoRepository.findByRetificaIdIn(ids).stream()
                        .collect(Collectors.toMap(p -> p.getRetifica().getId(), Procedimento::getId));

        List<ProcedimentoResponse> itens = paginaProcedimentos.getContent().stream()
                .map(p -> procedimentoMapper.toResponse(p, retificadoPorPorId.get(p.getId())))
                .toList();

        return new PaginaResponse<>(
                itens,
                paginaProcedimentos.getNumber(),
                paginaProcedimentos.getSize(),
                paginaProcedimentos.getTotalElements(),
                paginaProcedimentos.getTotalPages());
    }

    private Procedimento validarRetificacao(UUID retificaId, UUID animalId) {
        Procedimento anterior = procedimentoRepository.findById(retificaId)
                .orElseThrow(ProcedimentoNaoEncontradoException::new);
        if (!anterior.getAnimal().getId().equals(animalId)) {
            throw new RetificacaoAnimalDivergenteException();
        }
        if (procedimentoRepository.existsByRetificaId(retificaId)) {
            throw new RegistroJaRetificadoException();
        }
        return anterior;
    }

    private TipoProcedimento resolverTipoProcedimento(String codigo) {
        return tipoProcedimentoRepository.findByCodigo(codigo).orElseThrow(TipoProcedimentoInvalidoException::new);
    }

    private Specification<Procedimento> construirFiltro(UUID animalId) {
        return (root, query, cb) -> {
            List<Predicate> predicados = new ArrayList<>();
            if (animalId != null) {
                predicados.add(cb.equal(root.get("animal").get("id"), animalId));
            }
            return cb.and(predicados.toArray(new Predicate[0]));
        };
    }
}
