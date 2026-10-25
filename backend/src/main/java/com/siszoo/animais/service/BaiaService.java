package com.siszoo.animais.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.siszoo.animais.dto.AtualizarBaiaRequest;
import com.siszoo.animais.dto.AtualizarStatusBaiaRequest;
import com.siszoo.animais.dto.BaiaResponse;
import com.siszoo.animais.dto.CriarBaiaRequest;
import com.siszoo.animais.dto.ResidenteBaiaResponse;
import com.siszoo.animais.entity.Baia;
import com.siszoo.animais.entity.StatusAnimal;
import com.siszoo.animais.entity.TipoBaia;
import com.siszoo.animais.exception.BaiaNaoEncontradaException;
import com.siszoo.animais.exception.TipoBaiaInvalidoException;
import com.siszoo.animais.mapper.BaiaMapper;
import com.siszoo.animais.repository.AnimalRepository;
import com.siszoo.animais.repository.BaiaRepository;
import com.siszoo.animais.repository.OcupacaoBaiaProjection;
import com.siszoo.animais.repository.TipoBaiaRepository;
import com.siszoo.comum.dto.PaginaResponse;
import com.siszoo.comum.util.Paginacao;
import com.siszoo.usuarios.entity.AcaoAuditoria;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.exception.UsuarioNaoEncontradoException;
import com.siszoo.usuarios.repository.UsuarioRepository;
import com.siszoo.usuarios.service.AuditoriaEventoService;

import jakarta.persistence.criteria.Predicate;

@Service
public class BaiaService {

    private static final Logger log = LoggerFactory.getLogger(BaiaService.class);

    // DER §3.3: status que removem o animal da contagem de ocupação da baia —
    // os mesmos que o tiram da custódia do CCZ (fonte única em StatusAnimal).
    private static final Set<String> STATUS_FORA_DA_OCUPACAO = StatusAnimal.CODIGOS_FORA_DA_CUSTODIA;

    // RNF10 (F2-078): baia e cadastro critico (define a ocupacao do canil) —
    // criacao, edicao, (des)ativacao e exclusao logica geram AuditoriaEvento.
    private static final String ENTIDADE_AUDITORIA = "baia";

    private final BaiaRepository baiaRepository;
    private final TipoBaiaRepository tipoBaiaRepository;
    private final AnimalRepository animalRepository;
    private final BaiaMapper baiaMapper;
    private final UsuarioRepository usuarioRepository;
    private final AuditoriaEventoService auditoriaEventoService;

    public BaiaService(
            BaiaRepository baiaRepository,
            TipoBaiaRepository tipoBaiaRepository,
            AnimalRepository animalRepository,
            BaiaMapper baiaMapper,
            UsuarioRepository usuarioRepository,
            AuditoriaEventoService auditoriaEventoService) {
        this.baiaRepository = baiaRepository;
        this.tipoBaiaRepository = tipoBaiaRepository;
        this.animalRepository = animalRepository;
        this.baiaMapper = baiaMapper;
        this.usuarioRepository = usuarioRepository;
        this.auditoriaEventoService = auditoriaEventoService;
    }

    @Transactional
    public BaiaResponse criar(CriarBaiaRequest request, UUID usuarioAutenticadoId) {
        Usuario autor = autor(usuarioAutenticadoId);
        Baia baia = new Baia();
        baia.setNome(request.nome());
        baia.setTipoBaia(resolverTipoBaia(request.tipoBaia()));
        baia.setCapacidade(request.capacidade());
        baia.setFinalidade(textoOuNulo(request.finalidade()));
        baia.setObservacoes(textoOuNulo(request.observacoes()));

        baiaRepository.save(baia);
        BaiaResponse response = mapearComOcupacao(baia, true);
        auditoriaEventoService.registrar(autor, AcaoAuditoria.CRIACAO, ENTIDADE_AUDITORIA, baia.getId(), null, response);
        return response;
    }

    @Transactional
    public BaiaResponse atualizar(UUID id, AtualizarBaiaRequest request, UUID usuarioAutenticadoId) {
        Baia baia = baiaRepository.findById(id).orElseThrow(BaiaNaoEncontradaException::new);
        Usuario autor = autor(usuarioAutenticadoId);
        BaiaResponse antes = mapearComOcupacao(baia, false);

        baia.setNome(request.nome());
        baia.setTipoBaia(resolverTipoBaia(request.tipoBaia()));
        baia.setCapacidade(request.capacidade());
        baia.setFinalidade(textoOuNulo(request.finalidade()));
        baia.setObservacoes(textoOuNulo(request.observacoes()));

        baiaRepository.save(baia);
        BaiaResponse depois = mapearComOcupacao(baia, true);
        auditoriaEventoService.registrar(autor, AcaoAuditoria.ATUALIZACAO, ENTIDADE_AUDITORIA, baia.getId(), antes, depois);
        return depois;
    }

    @Transactional
    public BaiaResponse alterarStatus(UUID id, AtualizarStatusBaiaRequest request, UUID usuarioAutenticadoId) {
        Baia baia = baiaRepository.findById(id).orElseThrow(BaiaNaoEncontradaException::new);
        Usuario autor = autor(usuarioAutenticadoId);
        BaiaResponse antes = mapearComOcupacao(baia, false);
        boolean ativar = Boolean.TRUE.equals(request.ativa());
        baia.setAtiva(ativar);
        baiaRepository.save(baia);
        BaiaResponse depois = mapearComOcupacao(baia, false);
        auditoriaEventoService.registrar(autor, ativar ? AcaoAuditoria.REATIVACAO : AcaoAuditoria.DESATIVACAO,
                ENTIDADE_AUDITORIA, baia.getId(), antes, depois);
        return depois;
    }

    @Transactional
    public BaiaResponse desativar(UUID id, UUID usuarioAutenticadoId) {
        Baia baia = baiaRepository.findById(id).orElseThrow(BaiaNaoEncontradaException::new);
        Usuario autor = autor(usuarioAutenticadoId);
        BaiaResponse antes = mapearComOcupacao(baia, false);
        baia.setAtiva(false);
        baiaRepository.save(baia);
        BaiaResponse depois = mapearComOcupacao(baia, false);
        auditoriaEventoService.registrar(autor, AcaoAuditoria.DESATIVACAO, ENTIDADE_AUDITORIA, baia.getId(), antes, depois);
        return depois;
    }

    private Usuario autor(UUID usuarioAutenticadoId) {
        return usuarioRepository.findById(usuarioAutenticadoId).orElseThrow(UsuarioNaoEncontradoException::new);
    }

    @Transactional(readOnly = true)
    public BaiaResponse buscarPorId(UUID id) {
        Baia baia = baiaRepository.findById(id).orElseThrow(BaiaNaoEncontradaException::new);
        return mapearComOcupacao(baia, false);
    }

    @Transactional(readOnly = true)
    public PaginaResponse<BaiaResponse> listar(Boolean ativa, int pagina, int tamanho) {
        Specification<Baia> filtro = construirFiltro(ativa);
        Page<Baia> paginaBaias = baiaRepository.findAll(
                filtro, Paginacao.pagina(pagina, tamanho, Sort.by("nome").ascending()));

        List<UUID> ids = paginaBaias.getContent().stream().map(Baia::getId).toList();
        Map<UUID, Long> ocupacaoPorBaia = ids.isEmpty()
                ? Map.of()
                : animalRepository.contarOcupacaoPorBaia(ids, STATUS_FORA_DA_OCUPACAO).stream()
                        .collect(Collectors.toMap(
                                OcupacaoBaiaProjection::getBaiaId, OcupacaoBaiaProjection::getTotal));

        List<BaiaResponse> itens = paginaBaias.getContent().stream()
                .map(baia -> {
                    long ocupacaoAtual = ocupacaoPorBaia.getOrDefault(baia.getId(), 0L);
                    return baiaMapper.toResponse(baia, ocupacaoAtual, ocupacaoAtual >= baia.getCapacidade());
                })
                .toList();

        return new PaginaResponse<>(
                itens,
                paginaBaias.getNumber(),
                paginaBaias.getSize(),
                paginaBaias.getTotalElements(),
                paginaBaias.getTotalPages());
    }

    // T45: residentes (sob custodia, mesmo criterio da ocupacao) de todas as
    // baias, por nome, numa consulta so de colunas leves.
    @Transactional(readOnly = true)
    public List<ResidenteBaiaResponse> listarResidentes() {
        return animalRepository.listarResidentesDeBaias(STATUS_FORA_DA_OCUPACAO).stream()
                .map(r -> new ResidenteBaiaResponse(r.getBaiaId(), r.getId(), r.getNome(), r.getFotoMiniatura()))
                .toList();
    }

    private BaiaResponse mapearComOcupacao(Baia baia, boolean avisarSeSuperlotada) {
        long ocupacaoAtual = animalRepository.countByBaia_IdAndStatus_CodigoNotIn(baia.getId(), STATUS_FORA_DA_OCUPACAO);
        boolean superlotada = ocupacaoAtual >= baia.getCapacidade();

        if (avisarSeSuperlotada && superlotada) {
            log.warn("Baia superlotada: baiaId={} capacidade={} ocupacaoAtual={}",
                    baia.getId(), baia.getCapacidade(), ocupacaoAtual);
        }

        return baiaMapper.toResponse(baia, ocupacaoAtual, superlotada);
    }

    private TipoBaia resolverTipoBaia(String codigo) {
        return tipoBaiaRepository.findByCodigo(codigo).orElseThrow(TipoBaiaInvalidoException::new);
    }

    // Texto vazio ou so com espacos vira NULL: a tela usa o tipo da baia quando
    // nao ha finalidade.
    private String textoOuNulo(String texto) {
        return StringUtils.hasText(texto) ? texto : null;
    }

    private Specification<Baia> construirFiltro(Boolean ativa) {
        return (root, query, cb) -> {
            List<Predicate> predicados = new ArrayList<>();
            if (ativa != null) {
                predicados.add(cb.equal(root.get("ativa"), ativa));
            }
            return cb.and(predicados.toArray(new Predicate[0]));
        };
    }
}
