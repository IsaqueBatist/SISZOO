package com.siszoo.processos.service;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

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
import com.siszoo.comum.util.Paginacao;
import com.siszoo.ocorrencias.entity.Ocorrencia;
import com.siszoo.ocorrencias.exception.DataAberturaFuturaException;
import com.siszoo.ocorrencias.service.OcorrenciaService;
import com.siszoo.ocorrencias.service.PermissoesOcorrencia;
import com.siszoo.processos.dto.AlterarStatusProcessoRequest;
import com.siszoo.processos.dto.AmostraAnimalRequest;
import com.siszoo.processos.dto.AmostraAnimalResponse;
import com.siszoo.processos.dto.CatalogosProcessoResponse;
import com.siszoo.processos.dto.CriarProcessoRequest;
import com.siszoo.processos.dto.ProcessoAuditoriaSnapshot;
import com.siszoo.processos.dto.ProcessoResumoResponse;
import com.siszoo.processos.dto.ProcessoSanitarioResponse;
import com.siszoo.processos.dto.RegistrarResultadoRequest;
import com.siszoo.processos.dto.ResponsavelProcessoRequest;
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
import com.siszoo.processos.exception.ConclusaoSemResultadoException;
import com.siszoo.processos.exception.CorrecaoResultadoNaoPermitidaException;
import com.siszoo.processos.exception.DataResultadoFuturaException;
import com.siszoo.processos.exception.DesfechoInvalidoException;
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
import com.siszoo.usuarios.entity.AcaoAuditoria;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.exception.UsuarioNaoEncontradoException;
import com.siszoo.usuarios.repository.UsuarioRepository;
import com.siszoo.usuarios.service.AuditoriaEventoService;

import jakarta.persistence.criteria.Predicate;

/**
 * Processo sanitario (T29, DER §3.5): criacao completa — processo, responsavel
 * e pelo menos uma amostra numa unica transacao —, consulta, listagem (T32),
 * catalogos, o avanco de status e o registro do resultado laboratorial com
 * desfecho e notificacao (T34 + T37). As regras de cada amostra ficam em
 * {@link AmostraProcessoFactory}; o mapeamento, em {@link ProcessoSanitarioMapper}.
 *
 * <p>Amostras na resposta e na auditoria: lidas uma vez por requisicao, depois
 * da ultima escrita. Status e resultado nao gravam amostra, entao o snapshot
 * anterior recebe a mesma lista ({@link ProcessoAuditoriaSnapshot#comAmostras}).
 *
 * <p>Ordem de locks: com {@code ocorrenciaId}, a ocorrencia e travada antes de
 * o processo existir (ver {@code OcorrenciaService}).
 */
@Service
public class ProcessoSanitarioService {

    private static final String ENTIDADE_AUDITORIA = "processo_sanitario";

    // R1 (T29): "sem resultado" e o vigente nulo; o codigo aguardando do
    // catalogo nao e um resultado lancavel.
    private static final String RESULTADO_SEM_RESULTADO = "aguardando";

    // Resultado definitivo, que nao se corrige (T35-15, trigger V21). A
    // notificacao ao municipe e criterio separado (RN10, F2-014: positivo e
    // inconclusivo) — ver ResultadosNotificaveis.
    private static final String RESULTADO_DEFINITIVO = "positivo";

    // Unico campo do evento de auditoria do envio da notificacao (T35-16).
    private static final String CAMPO_NOTIFICACAO_AUDITORIA = "dataNotificacaoMunicipe";

    // RN3 do front (T32), mesma regra da listagem de ocorrencias (D31):
    // urgentes primeiro, depois os mais recentes. Desempate pela criacao, nao
    // pelo protocolo: como texto, "999/2026" vem antes de "1000/2026".
    private static final Sort ORDEM_LISTAGEM = Sort.by(
            Sort.Order.desc("urgente"), Sort.Order.desc("dataAbertura"), Sort.Order.desc("criadoEm"));

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

    // ── Criacao ──────────────────────────────────────────

    @Transactional
    public ProcessoSanitarioResponse criar(CriarProcessoRequest request, PermissoesOcorrencia permissoes) {
        // Regras que nao dependem do banco vem primeiro: um request invalido
        // nao consome protocolo nem trava a ocorrencia.
        LocalDate hoje = LocalDate.now(clock);
        // Mesma regra da ocorrencia (D21): com o Clock do projeto, nao com @PastOrPresent.
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

        // D33: com ocorrenciaId, a escrita em ocorrencias e checada ANTES de
        // inserir o processo — sem ela, nada e criado. A ocorrencia e travada
        // antes do processo existir (ordem global de locks, ver OcorrenciaService).
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
        // F2-012: numeros GAL/SINAN registrados manualmente (RF-B01; sem integracao, 3.5.2).
        processo.setGalNumero(normalizarNumeroExterno(request.galNumero()));
        processo.setSinanNumero(normalizarNumeroExterno(request.sinanNumero()));
        // DER regra 18: contato humano em qualquer amostra torna o processo urgente.
        processo.setUrgente(request.amostras().stream().anyMatch(AmostraAnimalRequest::contatoHumano));
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

    // As constraint triggers da V13 (1 responsavel e >= 1 amostra) sao
    // adiadas para o COMMIT, que acontece fora do service: uma violacao ali
    // nao passaria pelo tratamento de DataIntegrityViolationException. Gravar
    // os pendentes e pedir IMMEDIATE confere tudo agora (PostgreSQL 16,
    // SET CONSTRAINTS: as pendencias sao verificadas na mudanca para
    // IMMEDIATE), e a violacao vira 409 como qualquer outra constraint.
    private void verificarConstraintsAdiadas() {
        processoRepository.flush();
        jdbcTemplate.execute("SET CONSTRAINTS ALL IMMEDIATE");
    }

    private static ResponsavelProcesso novoResponsavel(ProcessoSanitario processo, ResponsavelProcessoRequest request) {
        ResponsavelProcesso responsavel = new ResponsavelProcesso();
        responsavel.setProcesso(processo);
        responsavel.setNome(request.nome().trim());
        responsavel.setCpf(request.cpf());
        responsavel.setTelefone(request.telefone());
        responsavel.setEmail(request.email());
        responsavel.setCep(request.cep());
        responsavel.setEndereco(request.endereco());
        responsavel.setBairroResidencial(request.bairroResidencial());
        responsavel.setBairroOcorrencia(request.bairroOcorrencia());
        return responsavel;
    }

    // ── Consulta, listagem e catalogos ───────────────────

    // Filtros por codigo de doenca, status e urgencia, urgentes primeiro
    // (ORDEM_LISTAGEM). Sem filtro por bairro ou texto livre (T32). `urgente`
    // (T45, docs/contratos/processos-filtro-urgente.md) e opcional: ausente,
    // a listagem e a de sempre; presente, so os processos com aquele valor.
    @Transactional(readOnly = true)
    public PaginaResponse<ProcessoResumoResponse> listar(String doenca, StatusProcesso status, Boolean urgente,
            int pagina, int tamanho) {
        Specification<ProcessoSanitario> filtro = (root, query, cb) -> {
            List<Predicate> predicados = new ArrayList<>();
            if (StringUtils.hasText(doenca)) {
                predicados.add(cb.equal(root.get("doenca").get("codigo"), doenca));
            }
            if (status != null) {
                predicados.add(cb.equal(root.get("statusProcesso"), status));
            }
            if (urgente != null) {
                predicados.add(cb.equal(root.get("urgente"), urgente));
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

    // ── Status e resultado (T34 + T37) ───────────────────

    // Avanco manual de um passo (StatusProcesso): ABERTO -> AGUARDANDO_RESULTADO
    // e COM_RESULTADO -> CONCLUIDO. COM_RESULTADO so pelo registro do
    // resultado (registrarResultado), que substitui o placeholder da D18.
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
        // CONCLUIDO exige o vigente (DER §3.5): protege processos que chegaram a
        // COM_RESULTADO sem resultado pelo PATCH provisorio da D18.
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

    // Resultado laboratorial: registro critico imutavel (V14). Sem retificaId,
    // o primeiro resultado leva AGUARDANDO_RESULTADO a COM_RESULTADO; com ele,
    // a correcao do vigente, so em COM_RESULTADO (CONCLUIDO e terminal), e o
    // corrigido fica preservado. O registro, o vigente em processo_sanitario e
    // a auditoria entram na mesma transacao, sob o lock do processo, que
    // serializa lancamentos concorrentes no mesmo processo. Desfecho do
    // animal (T37) nao faz parte do historico imutavel — e so do processo, e
    // pode vir em qualquer lancamento (original ou correcao).
    @Transactional
    public ProcessoSanitarioResponse registrarResultado(UUID id, RegistrarResultadoRequest request, UUID usuarioId) {
        // Mesma regra das datas de coleta e de abertura: com o Clock do projeto.
        if (request.dataResultado().isAfter(LocalDate.now(clock))) {
            throw new DataResultadoFuturaException();
        }
        // Sem limite inferior (docs/decisoes/T34.md): a coleta e o laudo podem
        // anteceder a abertura, que e imutavel depois de gravada.
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

        // O registro vai antes do processo: uma violacao das garantias da V14
        // (original unico, correcao unica) desfaz tudo sem tocar no status.
        resultadoProcessoRepository.saveAndFlush(registro);
        processo.aplicarResultadoVigente(registro);
        if (desfecho != null) {
            processo.setDesfechoAnimal(desfecho);
        }
        // RN10 (F2-014): positivo e inconclusivo notificam o municipe. Um novo
        // lancamento notificavel (ex.: inconclusivo corrigido para positivo) e
        // uma nova notificacao: a data do envio anterior e zerada para que o
        // aceite deste envio seja gravado (registrarNotificacaoMunicipe e
        // idempotente so dentro de um mesmo lancamento).
        boolean notifica = ResultadosNotificaveis.notifica(resultado.getCodigo());
        if (notifica) {
            processo.reiniciarNotificacaoMunicipe();
        }
        processoRepository.saveAndFlush(processo);

        List<AmostraAnimalResponse> amostras = amostrasDe(processo);
        auditoriaEventoService.registrar(autor, AcaoAuditoria.ATUALIZACAO, ENTIDADE_AUDITORIA, id,
                antes.comAmostras(amostras), processoMapper.toSnapshot(processo, amostras));
        // Ponto unico de gravacao do resultado. O envio roda fora desta
        // transacao, depois do commit (NotificacaoResultadoListener). O envio
        // de um mesmo lancamento nao se repete (#37); a Vigilancia
        // Epidemiologica continua mockada (pendencia documentada no TG).
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

    // Como RN-C02: so o vigente (ainda nao corrigido) do mesmo processo.
    // T35-15: positivo e definitivo — nao se corrige (422), para nenhum
    // resultado; o trigger da V21 recusa o mesmo no banco.
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

    // T35-16/#37: data/hora em que o SMTP aceitou a notificacao ao municipe.
    // Chamado pelo callback do envio, depois do commit do resultado (o envio
    // e AFTER_COMMIT). REQUIRES_NEW: o callback pode rodar na thread do
    // listener, dentro da transacao readOnly de NotificacaoResultadoService
    // (future ja concluido), e a gravacao precisa da sua. Registro critico so
    // muda com log: evento de sistema (sem usuario), payload so com a data.
    // Idempotente: uma data ja gravada fica, sem novo evento.
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

    // ── Apoio ────────────────────────────────────────────

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

    // F2-012: GAL/SINAN sao texto livre opcional (sem espacos nas pontas; vazio = null).
    private static String normalizarNumeroExterno(String valor) {
        if (valor == null) {
            return null;
        }
        String limpo = valor.trim();
        return limpo.isEmpty() ? null : limpo;
    }
}
