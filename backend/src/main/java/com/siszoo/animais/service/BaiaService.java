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
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.siszoo.animais.dto.AtualizarBaiaRequest;
import com.siszoo.animais.dto.AtualizarStatusBaiaRequest;
import com.siszoo.animais.dto.BaiaResponse;
import com.siszoo.animais.dto.CriarBaiaRequest;
import com.siszoo.animais.entity.Baia;
import com.siszoo.animais.entity.TipoBaia;
import com.siszoo.animais.exception.BaiaNaoEncontradaException;
import com.siszoo.animais.exception.TipoBaiaInvalidoException;
import com.siszoo.animais.mapper.BaiaMapper;
import com.siszoo.animais.repository.AnimalRepository;
import com.siszoo.animais.repository.BaiaRepository;
import com.siszoo.animais.repository.OcupacaoBaiaProjection;
import com.siszoo.animais.repository.TipoBaiaRepository;
import com.siszoo.comum.dto.PaginaResponse;

import jakarta.persistence.criteria.Predicate;

@Service
public class BaiaService {

    private static final Logger log = LoggerFactory.getLogger(BaiaService.class);

    // DER §3.3: status que removem o animal da contagem de ocupação da baia.
    private static final Set<String> STATUS_FORA_DA_OCUPACAO =
            Set.of("adotado", "obito_natural", "obito_eutanasia", "transferido");

    private final BaiaRepository baiaRepository;
    private final TipoBaiaRepository tipoBaiaRepository;
    private final AnimalRepository animalRepository;
    private final BaiaMapper baiaMapper;

    public BaiaService(
            BaiaRepository baiaRepository,
            TipoBaiaRepository tipoBaiaRepository,
            AnimalRepository animalRepository,
            BaiaMapper baiaMapper) {
        this.baiaRepository = baiaRepository;
        this.tipoBaiaRepository = tipoBaiaRepository;
        this.animalRepository = animalRepository;
        this.baiaMapper = baiaMapper;
    }

    @Transactional
    public BaiaResponse criar(CriarBaiaRequest request) {
        Baia baia = new Baia();
        baia.setNome(request.nome());
        baia.setTipoBaia(resolverTipoBaia(request.tipoBaia()));
        baia.setCapacidade(request.capacidade());
        baia.setFinalidade(request.finalidade());
        baia.setObservacoes(request.observacoes());

        baiaRepository.save(baia);
        return mapearComOcupacao(baia, true);
    }

    @Transactional
    public BaiaResponse atualizar(UUID id, AtualizarBaiaRequest request) {
        Baia baia = baiaRepository.findById(id).orElseThrow(BaiaNaoEncontradaException::new);

        baia.setNome(request.nome());
        baia.setTipoBaia(resolverTipoBaia(request.tipoBaia()));
        baia.setCapacidade(request.capacidade());
        baia.setFinalidade(request.finalidade());
        baia.setObservacoes(request.observacoes());

        baiaRepository.save(baia);
        return mapearComOcupacao(baia, true);
    }

    @Transactional
    public BaiaResponse alterarStatus(UUID id, AtualizarStatusBaiaRequest request) {
        Baia baia = baiaRepository.findById(id).orElseThrow(BaiaNaoEncontradaException::new);
        baia.setAtiva(Boolean.TRUE.equals(request.ativa()));
        baiaRepository.save(baia);
        return mapearComOcupacao(baia, false);
    }

    @Transactional
    public BaiaResponse desativar(UUID id) {
        Baia baia = baiaRepository.findById(id).orElseThrow(BaiaNaoEncontradaException::new);
        baia.setAtiva(false);
        baiaRepository.save(baia);
        return mapearComOcupacao(baia, false);
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
                filtro, PageRequest.of(pagina, tamanho, Sort.by("nome").ascending()));

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
