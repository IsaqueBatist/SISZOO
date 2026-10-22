package com.siszoo.animais.clinico.service;

import java.time.Clock;
import java.time.LocalDate;
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
import org.springframework.util.StringUtils;

import com.siszoo.animais.clinico.dto.CriarExameRequest;
import com.siszoo.animais.clinico.dto.ExameResponse;
import com.siszoo.animais.clinico.entity.Exame;
import com.siszoo.animais.clinico.entity.TipoExame;
import com.siszoo.animais.clinico.exception.ExameNaoEncontradoException;
import com.siszoo.animais.clinico.exception.RegistroJaRetificadoException;
import com.siszoo.animais.clinico.exception.RetificacaoAnimalDivergenteException;
import com.siszoo.animais.clinico.exception.TipoExameInvalidoException;
import com.siszoo.animais.clinico.mapper.ExameMapper;
import com.siszoo.animais.clinico.repository.ExameRepository;
import com.siszoo.animais.clinico.repository.TipoExameRepository;
import com.siszoo.animais.entity.Animal;
import com.siszoo.animais.exception.AnimalNaoEncontradoException;
import com.siszoo.animais.repository.AnimalRepository;
import com.siszoo.comum.dto.PaginaResponse;
import com.siszoo.comum.exception.CampoInvalidoException;
import com.siszoo.processos.entity.Laboratorio;
import com.siszoo.processos.repository.LaboratorioRepository;
import com.siszoo.usuarios.entity.AcaoAuditoria;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.exception.UsuarioNaoEncontradoException;
import com.siszoo.usuarios.repository.UsuarioRepository;
import com.siszoo.usuarios.service.AuditoriaEventoService;

import jakarta.persistence.criteria.Predicate;

// F2-007 / RF-A04 (Fase 3 do TG). Sem metodo atualizar/excluir: registro clinico
// imutavel (RN06). Correcao = novo POST com `retificaId` (ver ProcedimentoService).
@Service
public class ExameService {

    private static final String ENTIDADE_AUDITORIA = "exame";

    private final ExameRepository exameRepository;
    private final TipoExameRepository tipoExameRepository;
    private final LaboratorioRepository laboratorioRepository;
    private final AnimalRepository animalRepository;
    private final UsuarioRepository usuarioRepository;
    private final ExameMapper exameMapper;
    private final AuditoriaEventoService auditoriaEventoService;
    private final Clock clock;

    public ExameService(
            ExameRepository exameRepository,
            TipoExameRepository tipoExameRepository,
            LaboratorioRepository laboratorioRepository,
            AnimalRepository animalRepository,
            UsuarioRepository usuarioRepository,
            ExameMapper exameMapper,
            AuditoriaEventoService auditoriaEventoService,
            Clock clock) {
        this.exameRepository = exameRepository;
        this.tipoExameRepository = tipoExameRepository;
        this.laboratorioRepository = laboratorioRepository;
        this.animalRepository = animalRepository;
        this.usuarioRepository = usuarioRepository;
        this.exameMapper = exameMapper;
        this.auditoriaEventoService = auditoriaEventoService;
        this.clock = clock;
    }

    @Transactional
    public ExameResponse criar(CriarExameRequest request, UUID usuarioAutenticadoId) {
        Animal animal = animalRepository.findById(request.animalId())
                .orElseThrow(AnimalNaoEncontradoException::new);
        Usuario usuarioAutenticado = usuarioRepository.findById(usuarioAutenticadoId)
                .orElseThrow(UsuarioNaoEncontradoException::new);
        validarDatas(request.dataSolicitacao(), request.dataResultado());
        // O resultado e o laudo do exame: sem data do resultado ele nao faz sentido (e vice-versa).
        if (StringUtils.hasText(request.resultado()) != (request.dataResultado() != null)) {
            throw new CampoInvalidoException("resultado", "Resultado e data do resultado devem ser informados juntos");
        }

        Exame anterior = request.retificaId() != null
                ? validarRetificacao(request.retificaId(), animal.getId())
                : null;

        Exame exame = new Exame();
        exame.setAnimal(animal);
        exame.setTipoExame(resolverTipoExame(request.tipoExame()));
        exame.setLaboratorio(resolverLaboratorio(request.laboratorio()));
        exame.setSolicitadoPor(usuarioAutenticado);
        exame.setDataSolicitacao(request.dataSolicitacao());
        exame.setDataResultado(request.dataResultado());
        exame.setResultado(textoOuNulo(request.resultado()));
        exame.setObservacoes(textoOuNulo(request.observacoes()));
        exame.setRetifica(anterior);

        exameRepository.save(exame);
        ExameResponse response = exameMapper.toResponse(exame, null);

        if (anterior != null) {
            auditoriaEventoService.registrar(usuarioAutenticado, AcaoAuditoria.ATUALIZACAO, ENTIDADE_AUDITORIA, exame.getId(),
                    exameMapper.toResponse(anterior, null), response);
        } else {
            auditoriaEventoService.registrar(usuarioAutenticado, AcaoAuditoria.CRIACAO, ENTIDADE_AUDITORIA, exame.getId(), null, response);
        }
        return response;
    }

    @Transactional(readOnly = true)
    public ExameResponse buscarPorId(UUID id) {
        Exame exame = exameRepository.findById(id).orElseThrow(ExameNaoEncontradoException::new);
        UUID retificadoPorId = exameRepository.findByRetificaId(id).map(Exame::getId).orElse(null);
        return exameMapper.toResponse(exame, retificadoPorId);
    }

    @Transactional(readOnly = true)
    public PaginaResponse<ExameResponse> listar(UUID animalId, int pagina, int tamanho) {
        Page<Exame> paginaExames = exameRepository.findAll(
                construirFiltro(animalId), PageRequest.of(pagina, tamanho, Sort.by("dataSolicitacao").descending()));
        List<UUID> ids = paginaExames.getContent().stream().map(Exame::getId).toList();
        Map<UUID, UUID> retificadoPorPorId = ids.isEmpty()
                ? Map.of()
                : exameRepository.findByRetificaIdIn(ids).stream()
                        .collect(Collectors.toMap(e -> e.getRetifica().getId(), Exame::getId));
        List<ExameResponse> itens = paginaExames.getContent().stream()
                .map(e -> exameMapper.toResponse(e, retificadoPorPorId.get(e.getId())))
                .toList();
        return new PaginaResponse<>(itens, paginaExames.getNumber(), paginaExames.getSize(),
                paginaExames.getTotalElements(), paginaExames.getTotalPages());
    }

    // Fatos ocorridos: nenhuma das datas e futura; resultado nao antecede a solicitacao.
    private void validarDatas(LocalDate solicitacao, LocalDate resultado) {
        LocalDate hoje = LocalDate.now(clock);
        if (solicitacao.isAfter(hoje)) {
            throw new CampoInvalidoException("dataSolicitacao", "Data da solicitacao nao pode ser futura");
        }
        if (resultado != null) {
            if (resultado.isAfter(hoje)) {
                throw new CampoInvalidoException("dataResultado", "Data do resultado nao pode ser futura");
            }
            if (resultado.isBefore(solicitacao)) {
                throw new CampoInvalidoException("dataResultado", "Data do resultado nao pode ser anterior a solicitacao");
            }
        }
    }

    private Exame validarRetificacao(UUID retificaId, UUID animalId) {
        Exame anterior = exameRepository.findById(retificaId).orElseThrow(ExameNaoEncontradoException::new);
        if (!anterior.getAnimal().getId().equals(animalId)) {
            throw new RetificacaoAnimalDivergenteException();
        }
        if (exameRepository.existsByRetificaId(retificaId)) {
            throw new RegistroJaRetificadoException();
        }
        return anterior;
    }

    private TipoExame resolverTipoExame(String codigo) {
        return tipoExameRepository.findByCodigo(codigo).filter(TipoExame::isAtivo)
                .orElseThrow(TipoExameInvalidoException::new);
    }

    private Laboratorio resolverLaboratorio(String codigo) {
        if (!StringUtils.hasText(codigo)) {
            return null;
        }
        return laboratorioRepository.findByCodigo(codigo)
                .orElseThrow(() -> new CampoInvalidoException("laboratorio", "Laboratorio informado nao existe"));
    }

    private static String textoOuNulo(String texto) {
        return StringUtils.hasText(texto) ? texto.trim() : null;
    }

    private Specification<Exame> construirFiltro(UUID animalId) {
        return (root, query, cb) -> {
            List<Predicate> predicados = new ArrayList<>();
            if (animalId != null) {
                predicados.add(cb.equal(root.get("animal").get("id"), animalId));
            }
            return cb.and(predicados.toArray(new Predicate[0]));
        };
    }
}
