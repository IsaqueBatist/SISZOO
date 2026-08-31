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

import com.siszoo.animais.clinico.dto.CriarPrescricaoRequest;
import com.siszoo.animais.clinico.dto.PrescricaoResponse;
import com.siszoo.animais.clinico.entity.Medicamento;
import com.siszoo.animais.clinico.entity.Prescricao;
import com.siszoo.animais.clinico.exception.MedicamentoInvalidoException;
import com.siszoo.animais.clinico.exception.PrescricaoNaoEncontradaException;
import com.siszoo.animais.clinico.exception.RegistroJaRetificadoException;
import com.siszoo.animais.clinico.exception.RetificacaoAnimalDivergenteException;
import com.siszoo.animais.clinico.mapper.PrescricaoMapper;
import com.siszoo.animais.clinico.repository.MedicamentoRepository;
import com.siszoo.animais.clinico.repository.PrescricaoRepository;
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
// Transicoes de status (ATIVA->CONCLUIDA/SUSPENSA/CANCELADA) tambem passam
// por criar() com `retificaId`, nao ha metodo separado para isso. Ver
// VacinacaoService para o mecanismo de retificacao.
@Service
public class PrescricaoService {

    private final PrescricaoRepository prescricaoRepository;
    private final MedicamentoRepository medicamentoRepository;
    private final AnimalRepository animalRepository;
    private final UsuarioRepository usuarioRepository;
    private final PrescricaoMapper prescricaoMapper;
    private final AuditoriaEventoService auditoriaEventoService;

    public PrescricaoService(
            PrescricaoRepository prescricaoRepository,
            MedicamentoRepository medicamentoRepository,
            AnimalRepository animalRepository,
            UsuarioRepository usuarioRepository,
            PrescricaoMapper prescricaoMapper,
            AuditoriaEventoService auditoriaEventoService) {
        this.prescricaoRepository = prescricaoRepository;
        this.medicamentoRepository = medicamentoRepository;
        this.animalRepository = animalRepository;
        this.usuarioRepository = usuarioRepository;
        this.prescricaoMapper = prescricaoMapper;
        this.auditoriaEventoService = auditoriaEventoService;
    }

    @Transactional
    public PrescricaoResponse criar(CriarPrescricaoRequest request, UUID usuarioAutenticadoId) {
        Animal animal = animalRepository.findById(request.animalId())
                .orElseThrow(AnimalNaoEncontradoException::new);
        Usuario usuarioAutenticado = usuarioRepository.findById(usuarioAutenticadoId)
                .orElseThrow(UsuarioNaoEncontradoException::new);

        Prescricao anterior = request.retificaId() != null
                ? validarRetificacao(request.retificaId(), animal.getId())
                : null;

        Prescricao prescricao = new Prescricao();
        prescricao.setAnimal(animal);
        prescricao.setMedicamento(resolverMedicamento(request.medicamentoId()));
        prescricao.setPrescritoPor(usuarioAutenticado);
        prescricao.setDataInicio(request.dataInicio());
        prescricao.setDataFimPrevista(request.dataFimPrevista());
        prescricao.setDataFimReal(request.dataFimReal());
        prescricao.setFrequenciaAplicada(request.frequenciaAplicada());
        prescricao.setUnidadeFrequencia(request.unidadeFrequencia());
        prescricao.setDoseQuantidade(request.doseQuantidade());
        prescricao.setDoseUnidade(request.doseUnidade());
        prescricao.setViaAdministracao(request.viaAdministracao());
        prescricao.setStatus(request.status());
        prescricao.setRetifica(anterior);

        prescricaoRepository.save(prescricao);
        PrescricaoResponse response = prescricaoMapper.toResponse(prescricao, null);

        if (anterior != null) {
            auditoriaEventoService.registrar(usuarioAutenticado, AcaoAuditoria.ATUALIZACAO, "prescricao",
                    prescricaoMapper.toResponse(anterior, null), response);
        } else {
            auditoriaEventoService.registrar(usuarioAutenticado, AcaoAuditoria.CRIACAO, "prescricao", null, response);
        }

        return response;
    }

    @Transactional(readOnly = true)
    public PrescricaoResponse buscarPorId(UUID id) {
        Prescricao prescricao = prescricaoRepository.findById(id)
                .orElseThrow(PrescricaoNaoEncontradaException::new);
        UUID retificadoPorId = prescricaoRepository.findByRetificaId(id).map(Prescricao::getId).orElse(null);
        return prescricaoMapper.toResponse(prescricao, retificadoPorId);
    }

    @Transactional(readOnly = true)
    public PaginaResponse<PrescricaoResponse> listar(UUID animalId, int pagina, int tamanho) {
        Specification<Prescricao> filtro = construirFiltro(animalId);
        Page<Prescricao> paginaPrescricoes = prescricaoRepository.findAll(
                filtro, PageRequest.of(pagina, tamanho, Sort.by("dataInicio").descending()));

        List<UUID> ids = paginaPrescricoes.getContent().stream().map(Prescricao::getId).toList();
        Map<UUID, UUID> retificadoPorPorId = ids.isEmpty()
                ? Map.of()
                : prescricaoRepository.findByRetificaIdIn(ids).stream()
                        .collect(Collectors.toMap(p -> p.getRetifica().getId(), Prescricao::getId));

        List<PrescricaoResponse> itens = paginaPrescricoes.getContent().stream()
                .map(p -> prescricaoMapper.toResponse(p, retificadoPorPorId.get(p.getId())))
                .toList();

        return new PaginaResponse<>(
                itens,
                paginaPrescricoes.getNumber(),
                paginaPrescricoes.getSize(),
                paginaPrescricoes.getTotalElements(),
                paginaPrescricoes.getTotalPages());
    }

    private Prescricao validarRetificacao(UUID retificaId, UUID animalId) {
        Prescricao anterior = prescricaoRepository.findById(retificaId)
                .orElseThrow(PrescricaoNaoEncontradaException::new);
        if (!anterior.getAnimal().getId().equals(animalId)) {
            throw new RetificacaoAnimalDivergenteException();
        }
        if (prescricaoRepository.existsByRetificaId(retificaId)) {
            throw new RegistroJaRetificadoException();
        }
        return anterior;
    }

    private Medicamento resolverMedicamento(UUID medicamentoId) {
        return medicamentoRepository.findById(medicamentoId).orElseThrow(MedicamentoInvalidoException::new);
    }

    private Specification<Prescricao> construirFiltro(UUID animalId) {
        return (root, query, cb) -> {
            List<Predicate> predicados = new ArrayList<>();
            if (animalId != null) {
                predicados.add(cb.equal(root.get("animal").get("id"), animalId));
            }
            return cb.and(predicados.toArray(new Predicate[0]));
        };
    }
}
