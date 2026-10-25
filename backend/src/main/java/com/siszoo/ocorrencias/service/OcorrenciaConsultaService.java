package com.siszoo.ocorrencias.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.siszoo.comum.dto.CatalogoItemResponse;
import com.siszoo.comum.dto.PaginaResponse;
import com.siszoo.comum.util.Paginacao;
import com.siszoo.ocorrencias.dto.CatalogosOcorrenciaResponse;
import com.siszoo.ocorrencias.dto.OcorrenciaResponse;
import com.siszoo.ocorrencias.dto.OcorrenciaResumoResponse;
import com.siszoo.ocorrencias.dto.QuantidadePorBairroResponse;
import com.siszoo.ocorrencias.entity.Denunciante;
import com.siszoo.ocorrencias.entity.Ocorrencia;
import com.siszoo.ocorrencias.entity.StatusOcorrencia;
import com.siszoo.ocorrencias.exception.OcorrenciaNaoEncontradaException;
import com.siszoo.ocorrencias.mapper.OcorrenciaMapper;
import com.siszoo.ocorrencias.repository.DenuncianteRepository;
import com.siszoo.ocorrencias.repository.OcorrenciaRepository;
import com.siszoo.ocorrencias.repository.ProvidenciaTomadaRepository;
import com.siszoo.ocorrencias.repository.TipoOcorrenciaRepository;
import com.siszoo.processos.entity.ProcessoSanitario;
import com.siszoo.processos.repository.ProcessoSanitarioRepository;

import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Subquery;

// Leituras da ocorrencia (T25): detalhe, listagem, contagem por bairro e
// catalogos. O detalhe e a unica leitura que entrega o denunciante de
// ocorrencia sigilosa, e por isso a unica que grava auditoria.
@Service
public class OcorrenciaConsultaService {

    private static final String ENTIDADE_DENUNCIANTE = "denunciante";

    // D36: a busca aceita o protocolo com o prefixo de exibicao "OC" (com ou
    // sem espaco), desde que seguido de numero — "Ocara" continua sendo bairro.
    private static final Pattern PREFIXO_PROTOCOLO = Pattern.compile("^\\s*oc\\s*(?=\\d)", Pattern.CASE_INSENSITIVE);

    // Ordem padrao da listagem (D31): urgentes primeiro, depois as mais recentes.
    // Desempate pela criacao, nao pelo protocolo: como texto, "999/2026" vem
    // antes de "1000/2026" (T30).
    private static final Sort ORDEM_LISTAGEM = Sort.by(
            Sort.Order.desc("urgente"), Sort.Order.desc("dataAbertura"), Sort.Order.desc("criadoEm"));

    private final OcorrenciaRepository ocorrenciaRepository;
    private final DenuncianteRepository denuncianteRepository;
    private final ProcessoSanitarioRepository processoRepository;
    private final TipoOcorrenciaRepository tipoOcorrenciaRepository;
    private final ProvidenciaTomadaRepository providenciaTomadaRepository;
    private final OcorrenciaMapper ocorrenciaMapper;
    private final MontadorRespostaOcorrencia montadorResposta;
    private final AuditoriaSigiloOcorrencia auditoriaSigilo;

    public OcorrenciaConsultaService(
            OcorrenciaRepository ocorrenciaRepository,
            DenuncianteRepository denuncianteRepository,
            ProcessoSanitarioRepository processoRepository,
            TipoOcorrenciaRepository tipoOcorrenciaRepository,
            ProvidenciaTomadaRepository providenciaTomadaRepository,
            OcorrenciaMapper ocorrenciaMapper,
            MontadorRespostaOcorrencia montadorResposta,
            AuditoriaSigiloOcorrencia auditoriaSigilo) {
        this.ocorrenciaRepository = ocorrenciaRepository;
        this.denuncianteRepository = denuncianteRepository;
        this.processoRepository = processoRepository;
        this.tipoOcorrenciaRepository = tipoOcorrenciaRepository;
        this.providenciaTomadaRepository = providenciaTomadaRepository;
        this.ocorrenciaMapper = ocorrenciaMapper;
        this.montadorResposta = montadorResposta;
        this.auditoriaSigilo = auditoriaSigilo;
    }

    // Ponto unico de leitura do detalhe. Quem recebe o denunciante completo
    // de ocorrencia sigilosa gera VISUALIZACAO (T26), uma por requisicao, sem
    // deduplicacao. Sem readOnly: numa transacao readOnly o INSERT da
    // auditoria (REQUIRED, participa desta) seria descartado sem erro
    // (FlushMode.MANUAL) ou recusado pelo PostgreSQL (25006). T43: quem le o
    // modulo sem denunciante_sigiloso recebe o denunciante mascarado e gera
    // ACESSO_NEGADO (so quando ha denunciante cadastrado, como a
    // VISUALIZACAO). Nao lanca 403: o detalhe mascarado e a resposta.
    @Transactional
    public OcorrenciaResponse buscarPorId(UUID id, PermissoesOcorrencia permissoes) {
        Ocorrencia ocorrencia = ocorrenciaRepository.findDetalheById(id)
                .orElseThrow(OcorrenciaNaoEncontradaException::new);
        Denunciante denunciante = denuncianteRepository.findByOcorrenciaId(id).orElse(null);
        OcorrenciaResponse resposta = montadorResposta.paraDetalhe(ocorrencia, denunciante, permissoes);
        if (ocorrencia.isSigilosa() && denunciante != null) {
            if (permissoes.podeVerSigilo()) {
                auditoriaSigilo.registrarVisualizacao(permissoes, ENTIDADE_DENUNCIANTE, denunciante.getId(), id);
            } else {
                auditoriaSigilo.registrarAcessoNegado(permissoes, ENTIDADE_DENUNCIANTE, denunciante.getId(), id);
            }
        }
        return resposta;
    }

    // F2-010 (RF-E02): filtro por periodo da data de abertura (dias inclusivos).
    // readOnly: pagina, denunciantes e processos da pagina lidos na mesma
    // transacao. Nada aqui grava — a listagem nao gera VISUALIZACAO.
    @Transactional(readOnly = true)
    public PaginaResponse<OcorrenciaResumoResponse> listar(String tipo, StatusOcorrencia status, String q,
            LocalDate de, LocalDate ate, int pagina, int tamanho, PermissoesOcorrencia permissoes) {
        Page<Ocorrencia> paginaOcorrencias = ocorrenciaRepository.findAll(
                construirFiltro(tipo, status, q, de, ate),
                Paginacao.pagina(pagina, tamanho, ORDEM_LISTAGEM));

        List<UUID> ids = paginaOcorrencias.getContent().stream().map(Ocorrencia::getId).toList();
        Map<UUID, Denunciante> denunciantes = ids.isEmpty() ? Map.of()
                : denuncianteRepository.findByOcorrenciaIdIn(ids).stream()
                        .collect(Collectors.toMap(d -> d.getOcorrencia().getId(), Function.identity()));
        Map<UUID, ProcessoSanitario> processos = ids.isEmpty() ? Map.of()
                : processoRepository.findByOcorrenciaIdIn(ids).stream()
                        .collect(Collectors.toMap(p -> p.getOcorrencia().getId(), Function.identity()));

        // A listagem nao entrega dado de denunciante de ocorrencia sigilosa a
        // ninguem (o mapper devolve o nome null).
        return PaginaResponse.de(paginaOcorrencias.map(o -> ocorrenciaMapper.toResumo(
                o, denunciantes.get(o.getId()), processos.get(o.getId()), permissoes.podeVerSigilo())));
    }

    // T45: contagem agregada no banco para o grafico e as sugestoes de bairro,
    // em vez de a tela baixar ate 500 ocorrencias (duas vezes) so para contar.
    @Transactional(readOnly = true)
    public List<QuantidadePorBairroResponse> contarPorBairro() {
        return ocorrenciaRepository.contarTodasPorBairro().stream()
                .map(linha -> new QuantidadePorBairroResponse(linha.getBairro(), linha.getQuantidade()))
                .toList();
    }

    @Transactional(readOnly = true)
    public CatalogosOcorrenciaResponse catalogos() {
        return new CatalogosOcorrenciaResponse(
                tipoOcorrenciaRepository.findByAtivoTrueOrderByNomeAsc().stream()
                        .map(t -> new CatalogoItemResponse(t.getCodigo(), t.getNome())).toList(),
                providenciaTomadaRepository.findByAtivoTrueOrderByNomeAsc().stream()
                        .map(p -> new CatalogoItemResponse(p.getCodigo(), p.getNome())).toList());
    }

    private Specification<Ocorrencia> construirFiltro(String tipo, StatusOcorrencia status, String q,
            LocalDate de, LocalDate ate) {
        return (root, query, cb) -> {
            List<Predicate> predicados = new ArrayList<>();
            if (StringUtils.hasText(tipo)) {
                predicados.add(cb.equal(root.get("tipoOcorrencia").get("codigo"), tipo));
            }
            // F2-010: periodo da data de abertura, dias inclusivos.
            if (de != null) {
                predicados.add(cb.greaterThanOrEqualTo(root.get("dataAbertura"), de));
            }
            if (ate != null) {
                predicados.add(cb.lessThanOrEqualTo(root.get("dataAbertura"), ate));
            }
            if (status != null) {
                predicados.add(cb.equal(root.get("statusOcorrencia"), status));
            }
            if (StringUtils.hasText(q)) {
                String termo = "%" + PREFIXO_PROTOCOLO.matcher(q).replaceFirst("").trim().toLowerCase() + "%";

                // O nome do denunciante de ocorrencia sigilosa nunca entra na
                // busca, para nenhum perfil (T26, revisao da D14): a listagem
                // nao o devolve nem o audita, entao a busca nao pode confirmar
                // a identidade por canal lateral. Protocolo e bairro continuam.
                Subquery<UUID> porDenunciante = query.subquery(UUID.class);
                var denunciante = porDenunciante.from(Denunciante.class);
                porDenunciante.select(denunciante.get("ocorrencia").get("id"))
                        .where(cb.like(cb.lower(denunciante.get("nome")), termo));

                predicados.add(cb.or(
                        cb.like(cb.lower(root.get("protocolo")), termo),
                        cb.like(cb.lower(root.get("bairro")), termo),
                        cb.and(cb.isFalse(root.get("sigilosa")), root.get("id").in(porDenunciante))));
            }
            return cb.and(predicados.toArray(new Predicate[0]));
        };
    }
}
