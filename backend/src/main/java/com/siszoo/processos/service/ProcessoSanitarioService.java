package com.siszoo.processos.service;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.siszoo.animais.clinico.exception.RegistroJaRetificadoException;
import com.siszoo.comum.dto.CatalogoItemResponse;
import com.siszoo.comum.dto.PaginaResponse;
import com.siszoo.comum.service.ProtocoloService;
import com.siszoo.comum.util.BuscaTexto;
import com.siszoo.comum.util.Paginacao;
import com.siszoo.comum.util.Textos;
import com.siszoo.ocorrencias.entity.Ocorrencia;
import com.siszoo.ocorrencias.exception.DataAberturaFuturaException;
import com.siszoo.ocorrencias.service.OcorrenciaService;
import com.siszoo.ocorrencias.service.PermissoesOcorrencia;
import com.siszoo.processos.dto.AlterarStatusProcessoRequest;
import com.siszoo.processos.dto.AmostraAnimalRequest;
import com.siszoo.processos.dto.AmostraAnimalResponse;
import com.siszoo.processos.dto.CatalogosProcessoResponse;
import com.siszoo.processos.dto.CriarProcessoRequest;
import com.siszoo.processos.dto.EditarProcessoRequest;
import com.siszoo.processos.dto.ProcessoAuditoriaSnapshot;
import com.siszoo.processos.dto.ProcessoEdicaoAuditoria;
import com.siszoo.processos.dto.ProcessoResumoResponse;
import com.siszoo.processos.dto.ProcessoSanitarioResponse;
import com.siszoo.processos.dto.RegistrarResultadoRequest;
import com.siszoo.processos.dto.ResponsavelProcessoRequest;
import com.siszoo.processos.entity.AnimalAmostrado;
import com.siszoo.processos.entity.DesfechoAnimal;
import com.siszoo.processos.entity.Doenca;
import com.siszoo.processos.entity.Laboratorio;
import com.siszoo.processos.entity.ProcessoSanitario;
import com.siszoo.processos.entity.ResponsavelProcesso;
import com.siszoo.processos.entity.ResultadoLaboratorial;
import com.siszoo.processos.entity.ResultadoProcesso;
import com.siszoo.processos.entity.Sintoma;
import com.siszoo.processos.entity.StatusProcesso;
import com.siszoo.processos.event.ResultadoLancadoEvent;
import com.siszoo.processos.exception.AmostrasDaEdicaoDivergentesException;
import com.siszoo.processos.exception.ConclusaoSemResultadoException;
import com.siszoo.processos.exception.CorrecaoResultadoNaoPermitidaException;
import com.siszoo.processos.exception.DataResultadoFuturaException;
import com.siszoo.processos.exception.DesfechoInvalidoException;
import com.siszoo.processos.exception.DoencaComResultadoLancadoException;
import com.siszoo.processos.exception.DoencaInvalidaException;
import com.siszoo.processos.exception.LaboratorioInvalidoException;
import com.siszoo.processos.exception.ProcessoNaoEncontradoException;
import com.siszoo.processos.exception.ResultadoInvalidoException;
import com.siszoo.processos.exception.ResultadoJaRegistradoException;
import com.siszoo.processos.exception.ResultadoObrigatorioException;
import com.siszoo.processos.exception.ResultadoPositivoDefinitivoException;
import com.siszoo.processos.exception.ResultadoRetificadoInvalidoException;
import com.siszoo.processos.exception.TransicaoStatusProcessoInvalidaException;
import com.siszoo.processos.mapper.ProcessoSanitarioMapper;
import com.siszoo.processos.repository.AnimalAmostradoRepository;
import com.siszoo.processos.repository.DesfechoAnimalRepository;
import com.siszoo.processos.repository.DoencaRepository;
import com.siszoo.processos.repository.LaboratorioRepository;
import com.siszoo.processos.repository.ProcessoSanitarioRepository;
import com.siszoo.processos.repository.ResponsavelProcessoRepository;
import com.siszoo.processos.repository.ResultadoLaboratorialRepository;
import com.siszoo.processos.repository.ResultadoProcessoRepository;
import com.siszoo.processos.repository.SintomaRepository;
import com.siszoo.usuarios.dto.AuditoriaEventoResponse;
import com.siszoo.usuarios.entity.AcaoAuditoria;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.exception.UsuarioNaoEncontradoException;
import com.siszoo.usuarios.repository.UsuarioRepository;
import com.siszoo.usuarios.service.AuditoriaEventoService;

import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Subquery;

@Service
public class ProcessoSanitarioService {

    private static final String ENTIDADE_AUDITORIA = "processo_sanitario";

    private static final String RESULTADO_SEM_RESULTADO = "aguardando";

    private static final String RESULTADO_DEFINITIVO = "positivo";

    private static final String CAMPO_NOTIFICACAO_AUDITORIA = "dataNotificacaoMunicipe";

    private static final Sort ORDEM_LISTAGEM = Sort.by(
            Sort.Order.desc("urgente"), Sort.Order.desc("dataAbertura"), Sort.Order.desc("criadoEm"));

    private static final Pattern PREFIXO_PROTOCOLO = Pattern.compile("^\\s*ps\\s*(?=\\d)", Pattern.CASE_INSENSITIVE);
    private static final Pattern PREFIXO_OCORRENCIA = Pattern.compile("^\\s*oc\\s*(?=\\d)", Pattern.CASE_INSENSITIVE);

    private final ProcessoSanitarioRepository processoRepository;
    private final ResponsavelProcessoRepository responsavelRepository;
    private final AnimalAmostradoRepository amostraRepository;
    private final DoencaRepository doencaRepository;
    private final LaboratorioRepository laboratorioRepository;
    private final SintomaRepository sintomaRepository;
    private final ResultadoLaboratorialRepository resultadoRepository;
    private final ResultadoProcessoRepository resultadoProcessoRepository;
    private final DesfechoAnimalRepository desfechoRepository;
    private final UsuarioRepository usuarioRepository;
    private final OcorrenciaService ocorrenciaService;
    private final ProtocoloService protocoloService;
    private final AuditoriaEventoService auditoriaEventoService;
    private final ApplicationEventPublisher eventPublisher;
    private final JdbcTemplate jdbcTemplate;
    private final ProcessoSanitarioMapper processoMapper;
    private final AmostraProcessoFactory amostraFactory;
    private final Clock clock;

    public ProcessoSanitarioService(
            ProcessoSanitarioRepository processoRepository,
            ResponsavelProcessoRepository responsavelRepository,
            AnimalAmostradoRepository amostraRepository,
            DoencaRepository doencaRepository,
            LaboratorioRepository laboratorioRepository,
            SintomaRepository sintomaRepository,
            ResultadoLaboratorialRepository resultadoRepository,
            ResultadoProcessoRepository resultadoProcessoRepository,
            DesfechoAnimalRepository desfechoRepository,
            UsuarioRepository usuarioRepository,
            OcorrenciaService ocorrenciaService,
            ProtocoloService protocoloService,
            AuditoriaEventoService auditoriaEventoService,
            ApplicationEventPublisher eventPublisher,
            JdbcTemplate jdbcTemplate,
            ProcessoSanitarioMapper processoMapper,
            AmostraProcessoFactory amostraFactory,
            Clock clock) {
        this.processoRepository = processoRepository;
        this.responsavelRepository = responsavelRepository;
        this.amostraRepository = amostraRepository;
        this.doencaRepository = doencaRepository;
        this.laboratorioRepository = laboratorioRepository;
        this.sintomaRepository = sintomaRepository;
        this.resultadoRepository = resultadoRepository;
        this.resultadoProcessoRepository = resultadoProcessoRepository;
        this.desfechoRepository = desfechoRepository;
        this.usuarioRepository = usuarioRepository;
        this.ocorrenciaService = ocorrenciaService;
        this.protocoloService = protocoloService;
        this.auditoriaEventoService = auditoriaEventoService;
        this.eventPublisher = eventPublisher;
        this.jdbcTemplate = jdbcTemplate;
        this.processoMapper = processoMapper;
        this.amostraFactory = amostraFactory;
        this.clock = clock;
    }

    @Transactional
    public ProcessoSanitarioResponse criar(CriarProcessoRequest request, PermissoesOcorrencia permissoes) {
        LocalDate hoje = LocalDate.now(clock);
        if (request.dataAbertura().isAfter(hoje)) {
            throw new DataAberturaFuturaException();
        }
        request.amostras().forEach(amostra -> amostraFactory.validar(amostra, hoje));

        Usuario autor = buscarUsuario(permissoes.usuarioId());
        Doenca doenca = doencaRepository.findByCodigo(request.doenca())
                .filter(Doenca::isAtivo)
                .orElseThrow(DoencaInvalidaException::new);
        Laboratorio laboratorio = laboratorioRepository.findByCodigo(request.laboratorio())
                .filter(Laboratorio::isAtivo)
                .orElseThrow(LaboratorioInvalidoException::new);
        Map<String, Sintoma> sintomas = amostraFactory.resolverSintomas(request.amostras());

        Ocorrencia ocorrencia = null;
        if (request.ocorrenciaId() != null) {
            ocorrenciaService.exigirEscritaEmOcorrencias(permissoes);
            ocorrencia = ocorrenciaService.travarParaVinculo(request.ocorrenciaId());
        }

        ProcessoSanitario processo = new ProcessoSanitario();
        processo.setProtocolo(protocoloService.proximo(ProtocoloService.Entidade.PROCESSO));
        processo.setDataAbertura(request.dataAbertura());
        processo.setDoenca(doenca);
        processo.setCid(doenca.getCid());
        processo.setLaboratorio(laboratorio);
        processo.setObservacoes(request.observacoes());
        processo.setGalNumero(Textos.normalizar(request.galNumero()));
        processo.setSinanNumero(Textos.normalizar(request.sinanNumero()));
        processo.setUrgente(request.amostras().stream().map(AmostraAnimalRequest::contatoHumano).anyMatch(Boolean.TRUE::equals));
        processo.setCriadoPor(autor);
        processoRepository.save(processo);

        responsavelRepository.save(novoResponsavel(processo, request.responsavel()));
        amostraRepository.saveAll(request.amostras().stream()
                .map(amostra -> amostraFactory.nova(processo, amostra, sintomas))
                .toList());
        verificarConstraintsAdiadas();

        if (ocorrencia != null) {
            ocorrenciaService.vincular(ocorrencia, processo, autor);
        }

        List<AmostraAnimalResponse> amostras = amostrasDe(processo);
        auditoriaEventoService.registrar(autor, AcaoAuditoria.CRIACAO, ENTIDADE_AUDITORIA, processo.getId(),
                null, processoMapper.toSnapshot(processo, amostras));
        return resposta(processo, amostras);
    }

    @Transactional
    public ProcessoSanitarioResponse editar(UUID id, EditarProcessoRequest request, UUID usuarioId) {
        ProcessoSanitario processo = travar(id);
        LocalDate hoje = LocalDate.now(clock);
        List<AmostraAnimalRequest> dadosDasAmostras = request.amostras().stream()
                .map(EditarProcessoRequest.AmostraEditada::dados)
                .toList();
        dadosDasAmostras.forEach(amostra -> amostraFactory.validar(amostra, hoje));
        Doenca doenca = doencaDaEdicao(processo, request.doenca());
        Laboratorio laboratorio = laboratorioDaEdicao(processo, request.laboratorio());
        Map<String, Sintoma> sintomas = amostraFactory.resolverSintomas(dadosDasAmostras);
        List<AnimalAmostrado> amostras = amostraRepository.findByProcessoIdOrderByCriadoEmAscIdAsc(id);
        Map<UUID, AmostraAnimalRequest> correcoes = correcoesPorAmostra(amostras, request);
        ResponsavelProcesso responsavel = responsavelRepository.findByProcessoId(id)
                .orElseThrow(ProcessoNaoEncontradoException::new);
        Usuario autor = buscarUsuario(usuarioId);

        ProcessoEdicaoAuditoria antes = estadoParaAuditoria(processo, responsavel, null);

        processo.setDoenca(doenca);
        processo.setCid(doenca.getCid());
        processo.setLaboratorio(laboratorio);
        processo.setObservacoes(request.observacoes());
        processo.setGalNumero(Textos.normalizar(request.galNumero()));
        processo.setSinanNumero(Textos.normalizar(request.sinanNumero()));
        aplicarResponsavel(responsavel, request.responsavel());
        amostras.forEach(amostra -> amostraFactory.corrigir(amostra, correcoes.get(amostra.getId()), sintomas));
        processo.setUrgente(dadosDasAmostras.stream().map(AmostraAnimalRequest::contatoHumano).anyMatch(Boolean.TRUE::equals));
        processoRepository.flush();

        auditoriaEventoService.registrar(autor, AcaoAuditoria.ATUALIZACAO, ENTIDADE_AUDITORIA, id, antes,
                estadoParaAuditoria(processo, responsavel, request.justificativa().trim()));
        return resposta(processo, amostrasDe(processo));
    }

    private Doenca doencaDaEdicao(ProcessoSanitario processo, String codigo) {
        if (processo.getDoenca().getCodigo().equals(codigo)) {
            return processo.getDoenca();
        }
        if (processo.getResultadoLaboratorial() != null) {
            throw new DoencaComResultadoLancadoException();
        }
        return doencaRepository.findByCodigo(codigo).filter(Doenca::isAtivo).orElseThrow(DoencaInvalidaException::new);
    }

    private Laboratorio laboratorioDaEdicao(ProcessoSanitario processo, String codigo) {
        if (processo.getLaboratorio().getCodigo().equals(codigo)) {
            return processo.getLaboratorio();
        }
        return laboratorioRepository.findByCodigo(codigo)
                .filter(Laboratorio::isAtivo)
                .orElseThrow(LaboratorioInvalidoException::new);
    }

    private static Map<UUID, AmostraAnimalRequest> correcoesPorAmostra(List<AnimalAmostrado> amostras,
            EditarProcessoRequest request) {
        Map<UUID, AmostraAnimalRequest> correcoes = new HashMap<>();
        request.amostras().forEach(amostra -> correcoes.put(amostra.id(), amostra.dados()));
        boolean mesmasAmostras = correcoes.size() == request.amostras().size()
                && correcoes.keySet().equals(amostras.stream().map(AnimalAmostrado::getId).collect(Collectors.toSet()));
        if (!mesmasAmostras) {
            throw new AmostrasDaEdicaoDivergentesException();
        }
        for (AnimalAmostrado amostra : amostras) {
            UUID animalAtual = amostra.getAnimal() == null ? null : amostra.getAnimal().getId();
            if (!Objects.equals(animalAtual, correcoes.get(amostra.getId()).animalId())) {
                throw new AmostrasDaEdicaoDivergentesException();
            }
        }
        return correcoes;
    }

    private ProcessoEdicaoAuditoria estadoParaAuditoria(ProcessoSanitario processo, ResponsavelProcesso responsavel,
            String justificativa) {
        return new ProcessoEdicaoAuditoria(
                processoMapper.toSnapshot(processo, amostrasDe(processo)),
                processo.getGalNumero(),
                processo.getSinanNumero(),
                new ProcessoEdicaoAuditoria.ResponsavelAuditoria(responsavel.getNome(), responsavel.getCpf(),
                        responsavel.getTelefone(), responsavel.getEmail(), responsavel.getCep(),
                        responsavel.getEndereco(), responsavel.getBairroResidencial(), responsavel.getBairroOcorrencia()),
                justificativa);
    }

    @Transactional(readOnly = true)
    public List<AuditoriaEventoResponse> alteracoes(UUID id) {
        if (!processoRepository.existsById(id)) {
            throw new ProcessoNaoEncontradoException();
        }
        return auditoriaEventoService.listarPorEntidade(ENTIDADE_AUDITORIA, id);
    }

    private void verificarConstraintsAdiadas() {
        processoRepository.flush();
        jdbcTemplate.execute("SET CONSTRAINTS ALL IMMEDIATE");
    }

    private static ResponsavelProcesso novoResponsavel(ProcessoSanitario processo, ResponsavelProcessoRequest request) {
        ResponsavelProcesso responsavel = new ResponsavelProcesso();
        responsavel.setProcesso(processo);
        aplicarResponsavel(responsavel, request);
        return responsavel;
    }

    private static void aplicarResponsavel(ResponsavelProcesso responsavel, ResponsavelProcessoRequest request) {
        responsavel.setNome(request.nome().trim());
        responsavel.setCpf(request.cpf());
        responsavel.setTelefone(request.telefone());
        responsavel.setEmail(request.email());
        responsavel.setCep(request.cep());
        responsavel.setEndereco(request.endereco());
        responsavel.setBairroResidencial(request.bairroResidencial());
        responsavel.setBairroOcorrencia(request.bairroOcorrencia());
    }

    @Transactional(readOnly = true)
    public PaginaResponse<ProcessoResumoResponse> listar(String doenca, List<StatusProcesso> status, Boolean urgente,
            String q, LocalDate de, LocalDate ate, int pagina, int tamanho) {
        Specification<ProcessoSanitario> filtro = (root, query, cb) -> {
            List<Predicate> predicados = new ArrayList<>();
            if (StringUtils.hasText(doenca)) {
                predicados.add(cb.equal(root.get("doenca").get("codigo"), doenca));
            }
            if (status != null && !status.isEmpty()) {
                predicados.add(root.get("statusProcesso").in(status));
            }
            if (urgente != null) {
                predicados.add(cb.equal(root.get("urgente"), urgente));
            }
            if (de != null) {
                predicados.add(cb.greaterThanOrEqualTo(root.get("dataAbertura"), de));
            }
            if (ate != null) {
                predicados.add(cb.lessThanOrEqualTo(root.get("dataAbertura"), ate));
            }
            if (StringUtils.hasText(q)) {
                String termo = BuscaTexto.padrao(PREFIXO_PROTOCOLO.matcher(q).replaceFirst(""));
                Subquery<UUID> porResponsavel = query.subquery(UUID.class);
                var responsavel = porResponsavel.from(ResponsavelProcesso.class);
                porResponsavel.select(responsavel.get("processo").get("id"))
                        .where(BuscaTexto.contem(cb, responsavel.get("nome"), termo));

                Subquery<UUID> porOcorrencia = query.subquery(UUID.class);
                var ocorrencia = porOcorrencia.from(Ocorrencia.class);
                porOcorrencia.select(ocorrencia.get("id"))
                        .where(BuscaTexto.contem(cb, ocorrencia.get("protocolo"),
                                BuscaTexto.padrao(PREFIXO_OCORRENCIA.matcher(q).replaceFirst(""))));

                Subquery<UUID> porAnimal = query.subquery(UUID.class);
                var amostra = porAnimal.from(AnimalAmostrado.class);
                porAnimal.select(amostra.get("processo").get("id"))
                        .where(BuscaTexto.contem(cb, amostra.get("animal").get("nome"), termo));

                predicados.add(cb.or(
                        BuscaTexto.contem(cb, root.get("protocolo"), termo),
                        BuscaTexto.contem(cb, root.get("galNumero"), termo),
                        BuscaTexto.contem(cb, root.get("sinanNumero"), termo),
                        root.get("id").in(porResponsavel),
                        root.get("ocorrencia").get("id").in(porOcorrencia),
                        root.get("id").in(porAnimal)));
            }
            return cb.and(predicados.toArray(Predicate[]::new));
        };
        return PaginaResponse.de(processoRepository.findAll(filtro, Paginacao.pagina(pagina, tamanho, ORDEM_LISTAGEM))
                .map(processoMapper::toResumo));
    }

    @Transactional(readOnly = true)
    public ProcessoSanitarioResponse buscarPorId(UUID id) {
        ProcessoSanitario processo = processoRepository.findById(id).orElseThrow(ProcessoNaoEncontradoException::new);
        return resposta(processo, amostrasDe(processo));
    }

    @Transactional(readOnly = true)
    public CatalogosProcessoResponse catalogos() {
        return new CatalogosProcessoResponse(
                doencaRepository.findByAtivoTrueOrderByNomeAsc().stream()
                        .map(d -> new CatalogoItemResponse(d.getCodigo(), d.getNome())).toList(),
                laboratorioRepository.findByAtivoTrueOrderByNomeAsc().stream()
                        .map(l -> new CatalogoItemResponse(l.getCodigo(), l.getNome())).toList(),
                sintomaRepository.findByAtivoTrueOrderByNomeAsc().stream()
                        .map(s -> new CatalogoItemResponse(s.getCodigo(), s.getNome())).toList(),
                resultadoRepository.findByAtivoTrueOrderByNomeAsc().stream()
                        .map(r -> new CatalogoItemResponse(r.getCodigo(), r.getNome())).toList(),
                desfechoRepository.findByAtivoTrueOrderByNomeAsc().stream()
                        .map(d -> new CatalogoItemResponse(d.getCodigo(), d.getNome())).toList());
    }

    @Transactional
    public ProcessoSanitarioResponse alterarStatus(UUID id, AlterarStatusProcessoRequest request, UUID usuarioId) {
        ProcessoSanitario processo = travar(id);
        StatusProcesso destino = request.status();
        if (!processo.getStatusProcesso().podeTransicionarPara(destino)) {
            throw new TransicaoStatusProcessoInvalidaException();
        }
        if (destino.exigeResultado()) {
            throw new ResultadoObrigatorioException();
        }
        if (destino == StatusProcesso.CONCLUIDO && processo.getResultadoLaboratorial() == null) {
            throw new ConclusaoSemResultadoException();
        }
        Usuario autor = buscarUsuario(usuarioId);
        ProcessoAuditoriaSnapshot antes = processoMapper.toSnapshot(processo, List.of());

        processo.setStatusProcesso(destino);
        processoRepository.saveAndFlush(processo);

        List<AmostraAnimalResponse> amostras = amostrasDe(processo);
        auditoriaEventoService.registrar(autor, AcaoAuditoria.ATUALIZACAO, ENTIDADE_AUDITORIA, id,
                antes.comAmostras(amostras), processoMapper.toSnapshot(processo, amostras));
        return resposta(processo, amostras);
    }

    @Transactional
    public ProcessoSanitarioResponse registrarResultado(UUID id, RegistrarResultadoRequest request, UUID usuarioId) {
        if (request.dataResultado().isAfter(LocalDate.now(clock))) {
            throw new DataResultadoFuturaException();
        }
        ProcessoSanitario processo = travar(id);
        ResultadoLaboratorial resultado = resultadoRepository.findByCodigo(request.resultado())
                .filter(ResultadoLaboratorial::isAtivo)
                .filter(r -> !RESULTADO_SEM_RESULTADO.equals(r.getCodigo()))
                .orElseThrow(ResultadoInvalidoException::new);
        DesfechoAnimal desfecho = null;
        if (StringUtils.hasText(request.desfechoAnimal())) {
            desfecho = desfechoRepository.findByCodigo(request.desfechoAnimal())
                    .filter(DesfechoAnimal::isAtivo)
                    .orElseThrow(DesfechoInvalidoException::new);
        }
        Usuario autor = buscarUsuario(usuarioId);

        ResultadoProcesso registro;
        if (request.retificaId() == null) {
            exigirPrimeiroResultado(processo);
            registro = ResultadoProcesso.registrar(processo, resultado, request.dataResultado(),
                    request.observacoes(), autor);
        } else {
            ResultadoProcesso anterior = resultadoACorrigir(processo, request.retificaId());
            registro = ResultadoProcesso.retificar(anterior, resultado, request.dataResultado(),
                    request.observacoes(), autor);
        }
        ProcessoAuditoriaSnapshot antes = processoMapper.toSnapshot(processo, List.of());

        resultadoProcessoRepository.saveAndFlush(registro);
        processo.aplicarResultadoVigente(registro);
        if (desfecho != null) {
            processo.setDesfechoAnimal(desfecho);
        }
        boolean notifica = ResultadosNotificaveis.notifica(resultado.getCodigo());
        if (notifica) {
            processo.reiniciarNotificacaoMunicipe();
        }
        processoRepository.saveAndFlush(processo);

        List<AmostraAnimalResponse> amostras = amostrasDe(processo);
        auditoriaEventoService.registrar(autor, AcaoAuditoria.ATUALIZACAO, ENTIDADE_AUDITORIA, id,
                antes.comAmostras(amostras), processoMapper.toSnapshot(processo, amostras));
        if (notifica) {
            eventPublisher.publishEvent(new ResultadoLancadoEvent(id));
        }
        return resposta(processo, amostras);
    }

    private static void exigirPrimeiroResultado(ProcessoSanitario processo) {
        StatusProcesso atual = processo.getStatusProcesso();
        if (atual.podeTransicionarPara(StatusProcesso.COM_RESULTADO)) {
            return;
        }
        if (atual == StatusProcesso.COM_RESULTADO) {
            throw new ResultadoJaRegistradoException();
        }
        throw new TransicaoStatusProcessoInvalidaException();
    }

    private ResultadoProcesso resultadoACorrigir(ProcessoSanitario processo, UUID retificaId) {
        if (processo.getStatusProcesso() != StatusProcesso.COM_RESULTADO) {
            throw new CorrecaoResultadoNaoPermitidaException();
        }
        ResultadoProcesso anterior = resultadoProcessoRepository.findById(retificaId)
                .filter(r -> r.getProcesso().getId().equals(processo.getId()))
                .orElseThrow(ResultadoRetificadoInvalidoException::new);
        if (resultadoProcessoRepository.existsByRetificaId(retificaId)) {
            throw new RegistroJaRetificadoException();
        }
        if (RESULTADO_DEFINITIVO.equals(anterior.getResultadoLaboratorial().getCodigo())) {
            throw new ResultadoPositivoDefinitivoException();
        }
        return anterior;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void registrarNotificacaoMunicipe(UUID id, LocalDateTime aceitoEm) {
        ProcessoSanitario processo = travar(id);
        if (!processo.registrarNotificacaoMunicipe(aceitoEm)) {
            return;
        }
        processoRepository.saveAndFlush(processo);
        auditoriaEventoService.registrar(null, AcaoAuditoria.ATUALIZACAO, ENTIDADE_AUDITORIA, id,
                Collections.singletonMap(CAMPO_NOTIFICACAO_AUDITORIA, null),
                Map.of(CAMPO_NOTIFICACAO_AUDITORIA, aceitoEm));
    }

    private ProcessoSanitario travar(UUID id) {
        return processoRepository.findByIdForUpdate(id).orElseThrow(ProcessoNaoEncontradoException::new);
    }

    private Usuario buscarUsuario(UUID usuarioId) {
        return usuarioRepository.findById(usuarioId).orElseThrow(UsuarioNaoEncontradoException::new);
    }

    private List<AmostraAnimalResponse> amostrasDe(ProcessoSanitario processo) {
        return amostraRepository.findByProcessoIdOrderByCriadoEmAscIdAsc(processo.getId()).stream()
                .map(processoMapper::toAmostraResponse)
                .toList();
    }

    private ProcessoSanitarioResponse resposta(ProcessoSanitario processo, List<AmostraAnimalResponse> amostras) {
        return processoMapper.toResponse(
                processo,
                responsavelRepository.findByProcessoId(processo.getId()).orElse(null),
                amostras,
                resultadoProcessoRepository.findByProcessoId(processo.getId()));
    }
}
