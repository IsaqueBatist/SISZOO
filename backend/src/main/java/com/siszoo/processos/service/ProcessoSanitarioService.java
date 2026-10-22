package com.siszoo.processos.service;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.siszoo.animais.clinico.exception.RegistroJaRetificadoException;
import com.siszoo.animais.dto.CatalogoItemResponse;
import com.siszoo.animais.entity.Animal;
import com.siszoo.animais.exception.AnimalNaoEncontradoException;
import com.siszoo.animais.exception.EspecieInvalidaException;
import com.siszoo.animais.repository.AnimalRepository;
import com.siszoo.animais.repository.EspecieRepository;
import com.siszoo.comum.dto.PaginaResponse;
import com.siszoo.comum.service.ProtocoloService;
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
import com.siszoo.processos.dto.ResponsavelProcessoResponse;
import com.siszoo.processos.dto.ResultadoProcessoResponse;
import com.siszoo.processos.entity.AnimalAmostrado;
import com.siszoo.processos.entity.DesfechoAnimal;
import com.siszoo.processos.entity.Doenca;
import com.siszoo.processos.entity.Laboratorio;
import com.siszoo.processos.entity.ProcessoSanitario;
import com.siszoo.processos.entity.ResponsavelProcesso;
import com.siszoo.processos.entity.ResultadoLaboratorial;
import com.siszoo.processos.entity.ResultadoProcesso;
import com.siszoo.processos.entity.Sintoma;
import com.siszoo.processos.entity.StatusClinicoAmostra;
import com.siszoo.processos.entity.StatusProcesso;
import com.siszoo.processos.event.ResultadoLancadoEvent;
import com.siszoo.processos.exception.ConclusaoSemResultadoException;
import com.siszoo.processos.exception.ContatoHumanoInconsistenteException;
import com.siszoo.processos.exception.CorrecaoResultadoNaoPermitidaException;
import com.siszoo.processos.exception.DataColetaFuturaException;
import com.siszoo.processos.exception.DataResultadoFuturaException;
import com.siszoo.processos.exception.DesfechoInvalidoException;
import com.siszoo.processos.exception.DoencaInvalidaException;
import com.siszoo.processos.exception.IdentificacaoComAnimalDoCanilException;
import com.siszoo.processos.exception.IdentificacaoObrigatoriaException;
import com.siszoo.processos.exception.LaboratorioInvalidoException;
import com.siszoo.processos.exception.ProcessoNaoEncontradoException;
import com.siszoo.processos.exception.ResultadoInvalidoException;
import com.siszoo.processos.exception.ResultadoJaRegistradoException;
import com.siszoo.processos.exception.ResultadoObrigatorioException;
import com.siszoo.processos.exception.ResultadoPositivoDefinitivoException;
import com.siszoo.processos.exception.ResultadoRetificadoInvalidoException;
import com.siszoo.processos.exception.SintomaInvalidoException;
import com.siszoo.processos.exception.SintomaSemStatusSintomaticoException;
import com.siszoo.processos.exception.TransicaoStatusProcessoInvalidaException;
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
 * desfecho e notificacao (T34 + T37).
 *
 * <p>Amostras: com {@code animalId}, a identificacao e copiada da ficha do
 * animal neste momento (snapshot) e nunca mais relida; sem ele, vem do
 * request. Os campos clinicos vem sempre do request. Nao ha sincronizacao com
 * a ficha (DER regra 17).
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

    // Regra 19 (DER, revisao 2026-10-17): so positivo notifica o municipe.
    // Tambem e o resultado definitivo, que nao se corrige (T35-15).
    private static final String RESULTADO_QUE_NOTIFICA = "positivo";

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
    private final EspecieRepository especieRepository;
    private final AnimalRepository animalRepository;
    private final UsuarioRepository usuarioRepository;
    private final OcorrenciaService ocorrenciaService;
    private final ProtocoloService protocoloService;
    private final AuditoriaEventoService auditoriaEventoService;
    private final ApplicationEventPublisher eventPublisher;
    private final JdbcTemplate jdbcTemplate;
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
            EspecieRepository especieRepository,
            AnimalRepository animalRepository,
            UsuarioRepository usuarioRepository,
            OcorrenciaService ocorrenciaService,
            ProtocoloService protocoloService,
            AuditoriaEventoService auditoriaEventoService,
            ApplicationEventPublisher eventPublisher,
            JdbcTemplate jdbcTemplate,
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
        this.especieRepository = especieRepository;
        this.animalRepository = animalRepository;
        this.usuarioRepository = usuarioRepository;
        this.ocorrenciaService = ocorrenciaService;
        this.protocoloService = protocoloService;
        this.auditoriaEventoService = auditoriaEventoService;
        this.eventPublisher = eventPublisher;
        this.jdbcTemplate = jdbcTemplate;
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
        request.amostras().forEach(amostra -> validarAmostra(amostra, hoje));

        Usuario autor = usuarioRepository.findById(permissoes.usuarioId())
                .orElseThrow(UsuarioNaoEncontradoException::new);
        Doenca doenca = doencaRepository.findByCodigo(request.doenca())
                .filter(Doenca::isAtivo)
                .orElseThrow(DoencaInvalidaException::new);
        Laboratorio laboratorio = laboratorioRepository.findByCodigo(request.laboratorio())
                .filter(Laboratorio::isAtivo)
                .orElseThrow(LaboratorioInvalidoException::new);
        Map<String, Sintoma> sintomas = resolverSintomas(request.amostras());

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
        // DER regra 18: contato humano em qualquer amostra torna o processo urgente.
        processo.setUrgente(request.amostras().stream().anyMatch(AmostraAnimalRequest::contatoHumano));
        processo.setCriadoPor(autor);
        processoRepository.save(processo);

        responsavelRepository.save(novoResponsavel(processo, request.responsavel()));
        amostraRepository.saveAll(request.amostras().stream()
                .map(amostra -> novaAmostra(processo, amostra, sintomas))
                .toList());
        verificarConstraintsAdiadas();

        if (ocorrencia != null) {
            ocorrenciaService.vincular(ocorrencia, processo, autor);
        }

        auditoriaEventoService.registrar(autor, AcaoAuditoria.CRIACAO, ENTIDADE_AUDITORIA, processo.getId(),
                null, toSnapshot(processo));
        return toResponse(processo);
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

    private static void validarAmostra(AmostraAnimalRequest amostra, LocalDate hoje) {
        if (amostra.animalId() != null) {
            if (amostra.temIdentificacao()) {
                throw new IdentificacaoComAnimalDoCanilException();
            }
        } else if (amostra.especie() == null || amostra.especie().isBlank() || amostra.sexo() == null) {
            throw new IdentificacaoObrigatoriaException();
        }
        if (amostra.dataColeta().isAfter(hoje)) {
            throw new DataColetaFuturaException();
        }
        boolean comDadosDeContato = amostra.nivelContato() != null || amostra.agrediuHumano() != null;
        boolean contatoCompleto = amostra.nivelContato() != null && amostra.agrediuHumano() != null;
        if (amostra.contatoHumano() ? !contatoCompleto : comDadosDeContato) {
            throw new ContatoHumanoInconsistenteException();
        }
        if (!amostra.sintomasOuVazio().isEmpty() && amostra.statusClinico() != StatusClinicoAmostra.SINTOMATICO) {
            throw new SintomaSemStatusSintomaticoException();
        }
    }

    private Map<String, Sintoma> resolverSintomas(List<AmostraAnimalRequest> amostras) {
        Set<String> codigos = amostras.stream()
                .flatMap(amostra -> amostra.sintomasOuVazio().stream())
                .collect(Collectors.toSet());
        if (codigos.isEmpty()) {
            return Map.of();
        }
        Map<String, Sintoma> encontrados = sintomaRepository.findByCodigoIn(codigos).stream()
                .filter(Sintoma::isAtivo)
                .collect(Collectors.toMap(Sintoma::getCodigo, Function.identity()));
        if (!encontrados.keySet().containsAll(codigos)) {
            throw new SintomaInvalidoException();
        }
        return encontrados;
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

    private AnimalAmostrado novaAmostra(
            ProcessoSanitario processo, AmostraAnimalRequest request, Map<String, Sintoma> sintomas) {
        AnimalAmostrado amostra = new AnimalAmostrado();
        amostra.setProcesso(processo);
        if (request.animalId() != null) {
            // Qualquer status do animal pode ser amostrado na T29 (ponto a
            // confirmar com o CCZ, docs/decisoes/T29.md).
            Animal animal = animalRepository.findById(request.animalId())
                    .orElseThrow(AnimalNaoEncontradoException::new);
            amostra.setAnimal(animal);
            copiarIdentificacaoDaFicha(amostra, animal);
        } else {
            amostra.setEspecie(especieRepository.findByCodigo(request.especie())
                    .orElseThrow(EspecieInvalidaException::new));
            amostra.setSexo(request.sexo());
            amostra.setRaca(request.raca());
            amostra.setColoracao(request.coloracao());
            amostra.setPelagem(request.pelagem());
            amostra.setIdadeAprox(request.idadeAprox());
            amostra.setPesoKg(request.pesoKg());
        }
        amostra.setStatusClinico(request.statusClinico());
        amostra.setTipoAbrigo(request.tipoAbrigo());
        amostra.setAlteracaoComportamental(request.alteracaoComportamental());
        amostra.setDataColeta(request.dataColeta());
        amostra.setMaterialBiologico(request.materialBiologico());
        amostra.setContatoHumano(request.contatoHumano());
        amostra.setNivelContato(request.nivelContato());
        amostra.setAgrediuHumano(request.agrediuHumano());
        amostra.setObservacoes(request.observacoes());
        amostra.setSintomas(new HashSet<>(request.sintomasOuVazio().stream().map(sintomas::get).toList()));
        return amostra;
    }

    // Snapshot da identificacao (DER §3.5, DH-5): copiada uma vez, aqui.
    // Mudancas posteriores na ficha nao alteram a amostra.
    private static void copiarIdentificacaoDaFicha(AnimalAmostrado amostra, Animal animal) {
        amostra.setEspecie(animal.getEspecie());
        amostra.setSexo(animal.getSexo());
        amostra.setRaca(animal.getRaca());
        amostra.setColoracao(animal.getColoracao());
        amostra.setPelagem(animal.getPelagem());
        amostra.setIdadeAprox(animal.getIdadeAprox());
        amostra.setPesoKg(animal.getPesoKg());
    }

    // ── Consulta, listagem e catalogos ───────────────────

    // Filtros por codigo de doenca e status, urgentes primeiro (ORDEM_LISTAGEM).
    // Sem filtro por bairro ou texto livre (T32).
    @Transactional(readOnly = true)
    public PaginaResponse<ProcessoResumoResponse> listar(String doenca, StatusProcesso status, int pagina, int tamanho) {
        Specification<ProcessoSanitario> filtro = (root, query, cb) -> {
            List<Predicate> predicados = new ArrayList<>();
            if (StringUtils.hasText(doenca)) {
                predicados.add(cb.equal(root.get("doenca").get("codigo"), doenca));
            }
            if (status != null) {
                predicados.add(cb.equal(root.get("statusProcesso"), status));
            }
            return cb.and(predicados.toArray(Predicate[]::new));
        };
        return PaginaResponse.de(processoRepository.findAll(filtro, PageRequest.of(pagina, tamanho, ORDEM_LISTAGEM))
                .map(ProcessoSanitarioService::toResumo));
    }

    @Transactional(readOnly = true)
    public ProcessoSanitarioResponse buscarPorId(UUID id) {
        return toResponse(processoRepository.findById(id).orElseThrow(ProcessoNaoEncontradoException::new));
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
        ProcessoSanitario processo = processoRepository.findByIdForUpdate(id)
                .orElseThrow(ProcessoNaoEncontradoException::new);
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
        Usuario autor = usuarioRepository.findById(usuarioId).orElseThrow(UsuarioNaoEncontradoException::new);
        ProcessoAuditoriaSnapshot antes = toSnapshot(processo);

        processo.setStatusProcesso(destino);
        processoRepository.saveAndFlush(processo);

        auditoriaEventoService.registrar(autor, AcaoAuditoria.ATUALIZACAO, ENTIDADE_AUDITORIA, id, antes,
                toSnapshot(processo));
        return toResponse(processo);
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
        ProcessoSanitario processo = processoRepository.findByIdForUpdate(id)
                .orElseThrow(ProcessoNaoEncontradoException::new);
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
        Usuario autor = usuarioRepository.findById(usuarioId).orElseThrow(UsuarioNaoEncontradoException::new);

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
        ProcessoAuditoriaSnapshot antes = toSnapshot(processo);

        // O registro vai antes do processo: uma violacao das garantias da V14
        // (original unico, correcao unica) desfaz tudo sem tocar no status.
        resultadoProcessoRepository.saveAndFlush(registro);
        processo.aplicarResultadoVigente(registro);
        if (desfecho != null) {
            processo.setDesfechoAnimal(desfecho);
        }
        processoRepository.saveAndFlush(processo);

        auditoriaEventoService.registrar(autor, AcaoAuditoria.ATUALIZACAO, ENTIDADE_AUDITORIA, id, antes,
                toSnapshot(processo));
        // Ponto unico de gravacao do resultado: regra 19 (DER, revisao
        // 2026-10-17) — so positivo notifica, inclusive por correcao (ex.:
        // negativo -> positivo). O envio roda fora desta transacao, depois do
        // commit (NotificacaoResultadoListener). Como o positivo e definitivo
        // (resultadoACorrigir, T35-15), so um lancamento positivo existe por
        // processo: a notificacao sai no maximo uma vez (#37).
        if (RESULTADO_QUE_NOTIFICA.equals(resultado.getCodigo())) {
            eventPublisher.publishEvent(new ResultadoLancadoEvent(id));
        }
        return toResponse(processo);
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
    // resultado; o trigger da V20 recusa o mesmo no banco.
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
        if (RESULTADO_QUE_NOTIFICA.equals(anterior.getResultadoLaboratorial().getCodigo())) {
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
        ProcessoSanitario processo = processoRepository.findByIdForUpdate(id)
                .orElseThrow(ProcessoNaoEncontradoException::new);
        if (!processo.registrarNotificacaoMunicipe(aceitoEm)) {
            return;
        }
        processoRepository.saveAndFlush(processo);
        auditoriaEventoService.registrar(null, AcaoAuditoria.ATUALIZACAO, ENTIDADE_AUDITORIA, id,
                Collections.singletonMap(CAMPO_NOTIFICACAO_AUDITORIA, null),
                Map.of(CAMPO_NOTIFICACAO_AUDITORIA, aceitoEm));
    }

    // ── Apoio ────────────────────────────────────────────

    private List<AmostraAnimalResponse> amostrasDe(ProcessoSanitario processo) {
        return amostraRepository.findByProcessoIdOrderByCriadoEmAscIdAsc(processo.getId()).stream()
                .map(ProcessoSanitarioService::toAmostraResponse)
                .toList();
    }

    private ProcessoSanitarioResponse toResponse(ProcessoSanitario processo) {
        ResponsavelProcessoResponse responsavel = responsavelRepository.findByProcessoId(processo.getId())
                .map(ProcessoSanitarioService::toResponsavelResponse)
                .orElse(null);
        return new ProcessoSanitarioResponse(
                processo.getId(),
                processo.getProtocolo(),
                processo.getDataAbertura(),
                ocorrenciaIdDe(processo),
                ocorrenciaProtocoloDe(processo),
                processo.isUrgente(),
                processo.getStatusProcesso(),
                new CatalogoItemResponse(processo.getDoenca().getCodigo(), processo.getDoenca().getNome()),
                processo.getCid(),
                new CatalogoItemResponse(processo.getLaboratorio().getCodigo(), processo.getLaboratorio().getNome()),
                processo.getObservacoes(),
                responsavel,
                amostrasDe(processo),
                processo.getCriadoEm(),
                processo.getResultadoLaboratorial() == null ? null : new CatalogoItemResponse(
                        processo.getResultadoLaboratorial().getCodigo(), processo.getResultadoLaboratorial().getNome()),
                processo.getDataResultado(),
                catalogoDeDesfecho(processo),
                resultadosDe(processo),
                processo.getDataNotificacaoMunicipe());
    }

    // Historico em ordem de cadeia: o original e, a seguir, cada correcao da
    // anterior (V14 garante um original e no maximo uma correcao por linha).
    private List<ResultadoProcessoResponse> resultadosDe(ProcessoSanitario processo) {
        List<ResultadoProcesso> registros = resultadoProcessoRepository.findByProcessoId(processo.getId());
        Map<UUID, ResultadoProcesso> correcaoDe = registros.stream()
                .filter(r -> r.getRetifica() != null)
                .collect(Collectors.toMap(r -> r.getRetifica().getId(), Function.identity()));
        List<ResultadoProcessoResponse> cadeia = new ArrayList<>();
        ResultadoProcesso atual = registros.stream().filter(r -> r.getRetifica() == null).findFirst().orElse(null);
        while (atual != null) {
            cadeia.add(toResultadoResponse(atual));
            atual = correcaoDe.get(atual.getId());
        }
        return cadeia;
    }

    private static ResultadoProcessoResponse toResultadoResponse(ResultadoProcesso registro) {
        Usuario autor = registro.getRegistradoPor();
        return new ResultadoProcessoResponse(
                registro.getId(),
                new CatalogoItemResponse(registro.getResultadoLaboratorial().getCodigo(),
                        registro.getResultadoLaboratorial().getNome()),
                registro.getDataResultado(),
                registro.getObservacoes(),
                registro.getRetifica() == null ? null : registro.getRetifica().getId(),
                autor.getId(),
                autor.getNome() + " " + autor.getSobrenome(),
                registro.getRegistradoEm());
    }

    // Sem o responsavel: nenhum dado pessoal no evento (como a D23).
    private ProcessoAuditoriaSnapshot toSnapshot(ProcessoSanitario processo) {
        return new ProcessoAuditoriaSnapshot(
                processo.getId(),
                processo.getProtocolo(),
                processo.getDataAbertura(),
                ocorrenciaIdDe(processo),
                processo.isUrgente(),
                processo.getStatusProcesso(),
                processo.getDoenca().getCodigo(),
                processo.getCid(),
                processo.getLaboratorio().getCodigo(),
                processo.getObservacoes(),
                amostrasDe(processo),
                processo.getResultadoLaboratorial() == null ? null : processo.getResultadoLaboratorial().getCodigo(),
                processo.getDataResultado(),
                processo.getDesfechoAnimal() == null ? null : processo.getDesfechoAnimal().getCodigo());
    }

    private static UUID ocorrenciaIdDe(ProcessoSanitario processo) {
        return processo.getOcorrencia() == null ? null : processo.getOcorrencia().getId();
    }

    private static String ocorrenciaProtocoloDe(ProcessoSanitario processo) {
        return processo.getOcorrencia() == null ? null : processo.getOcorrencia().getProtocolo();
    }

    private static CatalogoItemResponse catalogoDeDesfecho(ProcessoSanitario processo) {
        DesfechoAnimal desfecho = processo.getDesfechoAnimal();
        return desfecho == null ? null : new CatalogoItemResponse(desfecho.getCodigo(), desfecho.getNome());
    }

    private static ProcessoResumoResponse toResumo(ProcessoSanitario processo) {
        return new ProcessoResumoResponse(
                processo.getId(),
                processo.getProtocolo(),
                processo.getDataAbertura(),
                new CatalogoItemResponse(processo.getDoenca().getCodigo(), processo.getDoenca().getNome()),
                processo.getStatusProcesso(),
                processo.isUrgente(),
                ocorrenciaIdDe(processo),
                ocorrenciaProtocoloDe(processo));
    }

    private static ResponsavelProcessoResponse toResponsavelResponse(ResponsavelProcesso responsavel) {
        return new ResponsavelProcessoResponse(
                responsavel.getId(),
                responsavel.getNome(),
                responsavel.getCpf(),
                responsavel.getTelefone(),
                responsavel.getEmail(),
                responsavel.getCep(),
                responsavel.getEndereco(),
                responsavel.getBairroResidencial(),
                responsavel.getBairroOcorrencia());
    }

    private static AmostraAnimalResponse toAmostraResponse(AnimalAmostrado amostra) {
        return new AmostraAnimalResponse(
                amostra.getId(),
                amostra.getAnimal() == null ? null : amostra.getAnimal().getId(),
                new CatalogoItemResponse(amostra.getEspecie().getCodigo(), amostra.getEspecie().getNome()),
                amostra.getSexo(),
                amostra.getRaca(),
                amostra.getColoracao(),
                amostra.getPelagem(),
                amostra.getIdadeAprox(),
                amostra.getPesoKg(),
                amostra.getStatusClinico(),
                amostra.getTipoAbrigo(),
                amostra.getAlteracaoComportamental(),
                amostra.getDataColeta(),
                amostra.getMaterialBiologico(),
                amostra.isContatoHumano(),
                amostra.getNivelContato(),
                amostra.getAgrediuHumano(),
                amostra.getObservacoes(),
                amostra.getSintomas().stream()
                        .sorted(Comparator.comparing(Sintoma::getNome))
                        .map(s -> new CatalogoItemResponse(s.getCodigo(), s.getNome()))
                        .toList());
    }
}
