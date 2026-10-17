package com.siszoo.processos.service;

import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.siszoo.animais.dto.CatalogoItemResponse;
import com.siszoo.animais.entity.Animal;
import com.siszoo.animais.entity.Especie;
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
import com.siszoo.processos.dto.ResponsavelProcessoRequest;
import com.siszoo.processos.dto.ResponsavelProcessoResponse;
import com.siszoo.processos.entity.AnimalAmostrado;
import com.siszoo.processos.entity.Doenca;
import com.siszoo.processos.entity.Laboratorio;
import com.siszoo.processos.entity.ProcessoSanitario;
import com.siszoo.processos.entity.ResponsavelProcesso;
import com.siszoo.processos.entity.Sintoma;
import com.siszoo.processos.entity.StatusClinicoAmostra;
import com.siszoo.processos.entity.StatusProcesso;
import com.siszoo.processos.exception.ContatoHumanoInconsistenteException;
import com.siszoo.processos.exception.DataColetaFuturaException;
import com.siszoo.processos.exception.DoencaInvalidaException;
import com.siszoo.processos.exception.IdentificacaoComAnimalDoCanilException;
import com.siszoo.processos.exception.IdentificacaoObrigatoriaException;
import com.siszoo.processos.exception.LaboratorioInvalidoException;
import com.siszoo.processos.exception.ProcessoNaoEncontradoException;
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
import com.siszoo.processos.repository.SintomaRepository;
import com.siszoo.usuarios.entity.AcaoAuditoria;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.exception.UsuarioNaoEncontradoException;
import com.siszoo.usuarios.repository.UsuarioRepository;
import com.siszoo.usuarios.service.AuditoriaEventoService;

import jakarta.persistence.criteria.Predicate;

/**
 * Processo sanitario (T29, DER §3.5): criacao completa — processo, responsavel
 * e pelo menos uma amostra numa unica transacao —, consulta, catalogos e o
 * avanco provisorio de status (D18).
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
    private final DesfechoAnimalRepository desfechoRepository;
    private final EspecieRepository especieRepository;
    private final AnimalRepository animalRepository;
    private final UsuarioRepository usuarioRepository;
    private final OcorrenciaService ocorrenciaService;
    private final ProtocoloService protocoloService;
    private final AuditoriaEventoService auditoriaEventoService;
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
            DesfechoAnimalRepository desfechoRepository,
            EspecieRepository especieRepository,
            AnimalRepository animalRepository,
            UsuarioRepository usuarioRepository,
            OcorrenciaService ocorrenciaService,
            ProtocoloService protocoloService,
            AuditoriaEventoService auditoriaEventoService,
            JdbcTemplate jdbcTemplate,
            Clock clock) {
        this.processoRepository = processoRepository;
        this.responsavelRepository = responsavelRepository;
        this.amostraRepository = amostraRepository;
        this.doencaRepository = doencaRepository;
        this.laboratorioRepository = laboratorioRepository;
        this.sintomaRepository = sintomaRepository;
        this.resultadoRepository = resultadoRepository;
        this.desfechoRepository = desfechoRepository;
        this.especieRepository = especieRepository;
        this.animalRepository = animalRepository;
        this.usuarioRepository = usuarioRepository;
        this.ocorrenciaService = ocorrenciaService;
        this.protocoloService = protocoloService;
        this.auditoriaEventoService = auditoriaEventoService;
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

    // ── Consulta e catalogos ─────────────────────────────

    // Filtros por codigo de doenca e status, urgentes primeiro (ORDEM_LISTAGEM).
    // Sem filtro por bairro ou texto livre.
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

    // ── Status (provisorio) ──────────────────────────────

    // Placeholder (D18): so avanca um passo por vez, sem campo de resultado e
    // sem notificacao por e-mail. A task de resultado substitui este fluxo.
    @Transactional
    public ProcessoSanitarioResponse alterarStatus(UUID id, AlterarStatusProcessoRequest request, UUID usuarioId) {
        ProcessoSanitario processo = processoRepository.findByIdForUpdate(id)
                .orElseThrow(ProcessoNaoEncontradoException::new);
        StatusProcesso proximo = processo.getStatusProcesso().proximo()
                .orElseThrow(TransicaoStatusProcessoInvalidaException::new);
        if (request.status() != proximo) {
            throw new TransicaoStatusProcessoInvalidaException();
        }
        Usuario autor = usuarioRepository.findById(usuarioId).orElseThrow(UsuarioNaoEncontradoException::new);
        ProcessoAuditoriaSnapshot antes = toSnapshot(processo);

        processo.setStatusProcesso(proximo);
        processoRepository.saveAndFlush(processo);

        auditoriaEventoService.registrar(autor, AcaoAuditoria.ATUALIZACAO, ENTIDADE_AUDITORIA, id, antes,
                toSnapshot(processo));
        return toResponse(processo);
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
                processo.getCriadoEm());
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
                amostrasDe(processo));
    }

    private static UUID ocorrenciaIdDe(ProcessoSanitario processo) {
        return processo.getOcorrencia() == null ? null : processo.getOcorrencia().getId();
    }

    private static String ocorrenciaProtocoloDe(ProcessoSanitario processo) {
        return processo.getOcorrencia() == null ? null : processo.getOcorrencia().getProtocolo();
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
