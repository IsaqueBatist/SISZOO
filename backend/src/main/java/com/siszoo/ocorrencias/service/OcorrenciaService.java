package com.siszoo.ocorrencias.service;

import java.io.IOException;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.siszoo.animais.dto.CatalogoItemResponse;
import com.siszoo.comum.dto.PaginaResponse;
import com.siszoo.comum.service.ProtocoloService;
import com.siszoo.ocorrencias.dto.AlterarStatusOcorrenciaRequest;
import com.siszoo.ocorrencias.dto.AnexoOcorrenciaResponse;
import com.siszoo.ocorrencias.dto.ArquivoAnexo;
import com.siszoo.ocorrencias.dto.AtualizarOcorrenciaRequest;
import com.siszoo.ocorrencias.dto.CatalogosOcorrenciaResponse;
import com.siszoo.ocorrencias.dto.CriarNotaRequest;
import com.siszoo.ocorrencias.dto.CriarOcorrenciaRequest;
import com.siszoo.ocorrencias.dto.DenunciadoRequest;
import com.siszoo.ocorrencias.dto.DenuncianteRequest;
import com.siszoo.ocorrencias.dto.EncerrarOcorrenciaRequest;
import com.siszoo.ocorrencias.dto.OcorrenciaResponse;
import com.siszoo.ocorrencias.dto.OcorrenciaResumoResponse;
import com.siszoo.ocorrencias.entity.AnexoOcorrencia;
import com.siszoo.ocorrencias.entity.AnexoOcorrenciaConteudo;
import com.siszoo.ocorrencias.entity.Denunciado;
import com.siszoo.ocorrencias.entity.Denunciante;
import com.siszoo.ocorrencias.entity.MovimentacaoOcorrencia;
import com.siszoo.ocorrencias.entity.Ocorrencia;
import com.siszoo.ocorrencias.entity.ProvidenciaTomada;
import com.siszoo.ocorrencias.entity.StatusOcorrencia;
import com.siszoo.ocorrencias.entity.TipoMovimentacaoOcorrencia;
import com.siszoo.ocorrencias.entity.TipoOcorrencia;
import com.siszoo.ocorrencias.exception.AnexoInvalidoException;
import com.siszoo.ocorrencias.exception.AnexoNaoEncontradoException;
import com.siszoo.ocorrencias.exception.AnonimaESigilosaException;
import com.siszoo.ocorrencias.exception.AnonimatoIrreversivelException;
import com.siszoo.ocorrencias.exception.DataAberturaFuturaException;
import com.siszoo.ocorrencias.exception.DenuncianteEmDenunciaAnonimaException;
import com.siszoo.ocorrencias.exception.DescricaoEncerramentoObrigatoriaException;
import com.siszoo.ocorrencias.exception.EncerramentoComProcessoPendenteException;
import com.siszoo.ocorrencias.exception.LimiteAnexosAtingidoException;
import com.siszoo.ocorrencias.exception.NomeDenuncianteObrigatorioException;
import com.siszoo.ocorrencias.exception.OcorrenciaEncerradaException;
import com.siszoo.ocorrencias.exception.OcorrenciaNaoEncontradaException;
import com.siszoo.ocorrencias.exception.ProvidenciaInvalidaException;
import com.siszoo.ocorrencias.exception.ProvidenciaObrigatoriaException;
import com.siszoo.ocorrencias.exception.TipoOcorrenciaInvalidoException;
import com.siszoo.ocorrencias.exception.TransicaoStatusInvalidaException;
import com.siszoo.ocorrencias.exception.UrgenciaDefinidaPeloProcessoException;
import com.siszoo.ocorrencias.exception.VinculoJaExistenteException;
import com.siszoo.ocorrencias.mapper.OcorrenciaMapper;
import com.siszoo.ocorrencias.repository.AnexoOcorrenciaConteudoRepository;
import com.siszoo.ocorrencias.repository.AnexoOcorrenciaRepository;
import com.siszoo.ocorrencias.repository.DenunciadoRepository;
import com.siszoo.ocorrencias.repository.DenuncianteRepository;
import com.siszoo.ocorrencias.repository.MovimentacaoOcorrenciaRepository;
import com.siszoo.ocorrencias.repository.OcorrenciaRepository;
import com.siszoo.ocorrencias.repository.ProvidenciaTomadaRepository;
import com.siszoo.ocorrencias.repository.TipoOcorrenciaRepository;
import com.siszoo.processos.entity.ProcessoSanitario;
import com.siszoo.processos.entity.StatusProcesso;
import com.siszoo.processos.exception.ProcessoNaoEncontradoException;
import com.siszoo.processos.repository.ProcessoSanitarioRepository;
import com.siszoo.usuarios.entity.AcaoAuditoria;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.exception.UsuarioNaoEncontradoException;
import com.siszoo.usuarios.repository.UsuarioRepository;
import com.siszoo.usuarios.service.AuditoriaEventoService;

import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Subquery;

/**
 * Regras da ocorrencia (T25).
 *
 * <p>Status: so muda por {@link #alterarStatus} e {@link #encerrar}, que aplicam
 * a matriz D5 na entidade e gravam a {@code movimentacao_ocorrencia}
 * correspondente na mesma transacao (D4). Nao ha exclusao (D8).
 *
 * <p>Ordem global de locks (anti-deadlock): todo caminho que trava ocorrencia e
 * processo trava primeiro a <b>ocorrencia</b> e depois o <b>processo</b> —
 * {@link #vincularProcesso} e {@code ProcessoSanitarioService.criar} com
 * {@code ocorrenciaId}. {@link #adicionarAnexo} trava so a ocorrencia. Um
 * caminho novo que inverta essa ordem reabre o risco de deadlock.
 */
@Service
public class OcorrenciaService {

    private static final String ENTIDADE_AUDITORIA = "ocorrencia";
    private static final String ENTIDADE_ANEXO = "anexo_ocorrencia";
    private static final String ENTIDADE_DENUNCIANTE = "denunciante";
    private static final String ENTIDADE_MOVIMENTACAO = "movimentacao_ocorrencia";
    private static final int MAXIMO_ANEXOS = 5;
    private static final int TAMANHO_MAXIMO_ANEXO = 5 * 1024 * 1024;
    private static final int TAMANHO_MAXIMO_NOME_ANEXO = 255;

    // D36: a busca aceita o protocolo com o prefixo de exibicao "OC" (com ou
    // sem espaco), desde que seguido de numero — "Ocara" continua sendo bairro.
    private static final Pattern PREFIXO_PROTOCOLO = Pattern.compile("^\\s*oc\\s*(?=\\d)", Pattern.CASE_INSENSITIVE);

    // Ordem padrao da listagem (D31): urgentes primeiro, depois as mais recentes.
    // Desempate pela criacao, nao pelo protocolo: como texto, "999/2026" vem
    // antes de "1000/2026" (T30).
    private static final Sort ORDEM_LISTAGEM = Sort.by(
            Sort.Order.desc("urgente"), Sort.Order.desc("dataAbertura"), Sort.Order.desc("criadoEm"));

    private final OcorrenciaRepository ocorrenciaRepository;
    private final TipoOcorrenciaRepository tipoOcorrenciaRepository;
    private final ProvidenciaTomadaRepository providenciaTomadaRepository;
    private final DenuncianteRepository denuncianteRepository;
    private final DenunciadoRepository denunciadoRepository;
    private final MovimentacaoOcorrenciaRepository movimentacaoRepository;
    private final AnexoOcorrenciaRepository anexoRepository;
    private final AnexoOcorrenciaConteudoRepository anexoConteudoRepository;
    private final ProcessoSanitarioRepository processoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProtocoloService protocoloService;
    private final OcorrenciaMapper ocorrenciaMapper;
    private final AuditoriaEventoService auditoriaEventoService;
    private final Clock clock;

    public OcorrenciaService(
            OcorrenciaRepository ocorrenciaRepository,
            TipoOcorrenciaRepository tipoOcorrenciaRepository,
            ProvidenciaTomadaRepository providenciaTomadaRepository,
            DenuncianteRepository denuncianteRepository,
            DenunciadoRepository denunciadoRepository,
            MovimentacaoOcorrenciaRepository movimentacaoRepository,
            AnexoOcorrenciaRepository anexoRepository,
            AnexoOcorrenciaConteudoRepository anexoConteudoRepository,
            ProcessoSanitarioRepository processoRepository,
            UsuarioRepository usuarioRepository,
            ProtocoloService protocoloService,
            OcorrenciaMapper ocorrenciaMapper,
            AuditoriaEventoService auditoriaEventoService,
            Clock clock) {
        this.ocorrenciaRepository = ocorrenciaRepository;
        this.tipoOcorrenciaRepository = tipoOcorrenciaRepository;
        this.providenciaTomadaRepository = providenciaTomadaRepository;
        this.denuncianteRepository = denuncianteRepository;
        this.denunciadoRepository = denunciadoRepository;
        this.movimentacaoRepository = movimentacaoRepository;
        this.anexoRepository = anexoRepository;
        this.anexoConteudoRepository = anexoConteudoRepository;
        this.processoRepository = processoRepository;
        this.usuarioRepository = usuarioRepository;
        this.protocoloService = protocoloService;
        this.ocorrenciaMapper = ocorrenciaMapper;
        this.auditoriaEventoService = auditoriaEventoService;
        this.clock = clock;
    }

    // ── Cadastro e edicao ────────────────────────────────

    @Transactional
    public OcorrenciaResponse criar(CriarOcorrenciaRequest request, PermissoesOcorrencia permissoes) {
        validarDataAbertura(request.dataAbertura());
        validarAnonimato(request.isAnonima(), request.isSigilosa(), request.denunciante());
        boolean temDenunciante = request.denunciante() != null && request.denunciante().temAlgumDado();
        validarNomeDenunciante(request.isAnonima(), request.isSigilosa(),
                temDenunciante ? request.denunciante().nome() : null);

        Usuario autor = buscarUsuario(permissoes.usuarioId());

        Ocorrencia ocorrencia = new Ocorrencia();
        ocorrencia.setProtocolo(protocoloService.proximo(ProtocoloService.Entidade.OCORRENCIA));
        ocorrencia.setTipoOcorrencia(resolverTipo(request.tipoOcorrencia()));
        ocorrencia.setDataAbertura(request.dataAbertura());
        ocorrencia.setHoraAbertura(request.horaAbertura());
        ocorrencia.setEndereco(request.endereco());
        ocorrencia.setBairro(request.bairro());
        ocorrencia.setPontoReferencia(request.pontoReferencia());
        ocorrencia.setDescricao(request.descricao());
        ocorrencia.setUrgente(request.isUrgente());
        ocorrencia.setSigilosa(request.isSigilosa());
        ocorrencia.setAnonima(request.isAnonima());
        ocorrencia.setLatitude(request.latitude());
        ocorrencia.setLongitude(request.longitude());
        ocorrencia.setRegistradoPor(autor);
        ocorrenciaRepository.save(ocorrencia);

        if (temDenunciante) {
            Denunciante denunciante = new Denunciante();
            denunciante.setOcorrencia(ocorrencia);
            aplicarDenunciante(denunciante, request.denunciante());
            denuncianteRepository.save(denunciante);
        }
        if (request.denunciado() != null && request.denunciado().temAlgumDado()) {
            Denunciado denunciado = new Denunciado();
            denunciado.setOcorrencia(ocorrencia);
            aplicarDenunciado(denunciado, request.denunciado());
            denunciadoRepository.save(denunciado);
        }

        registrarMovimentacao(ocorrencia, autor, TipoMovimentacaoOcorrencia.REGISTRADA,
                null, StatusOcorrencia.ABERTA, null);
        auditoriaEventoService.registrar(autor, AcaoAuditoria.CRIACAO, ENTIDADE_AUDITORIA, ocorrencia.getId(),
                null, ocorrenciaMapper.toSnapshot(ocorrencia, temDenunciante));

        return montarResposta(ocorrencia, permissoes);
    }

    // D10: edita campos descritivos ate o encerramento; grava so auditoria
    // (sem movimentacao). Blocos denunciante/denunciado: ausente = sem
    // alteracao; presente = substitui o bloco inteiro.
    @Transactional
    public OcorrenciaResponse atualizar(UUID id, AtualizarOcorrenciaRequest request, PermissoesOcorrencia permissoes) {
        Ocorrencia ocorrencia = travar(id);
        if (ocorrencia.isEncerrada()) {
            throw new OcorrenciaEncerradaException();
        }
        validarDataAbertura(request.dataAbertura());
        Usuario autor = buscarUsuario(permissoes.usuarioId());
        var antes = ocorrenciaMapper.toSnapshot(ocorrencia, false);

        // D31: o processo vinculado pode marcar a urgencia; o PUT nao pode
        // desmarcar o que o processo marcou.
        if (ocorrencia.isUrgente() && !request.urgente()) {
            processoRepository.findByOcorrenciaId(id)
                    .filter(ProcessoSanitario::isUrgente)
                    .ifPresent(p -> {
                        throw new UrgenciaDefinidaPeloProcessoException();
                    });
        }

        // D10: sigilo so muda com a feature denunciante_sigiloso.
        if (ocorrencia.isSigilosa() != request.sigilosa() && !permissoes.podeVerSigilo()) {
            throw new AccessDeniedException("Alterar o sigilo exige denunciante_sigiloso");
        }

        // D32: anonimato so vai de anonima para identificada, por quem tem a
        // feature e junto com os dados do denunciante.
        boolean identificando = ocorrencia.isAnonima() && !request.anonima();
        if (!ocorrencia.isAnonima() && request.anonima()) {
            throw new AnonimatoIrreversivelException();
        }
        if (identificando && !permissoes.podeVerSigilo()) {
            throw new AccessDeniedException("Identificar denuncia anonima exige denunciante_sigiloso");
        }
        if (request.anonima() && request.sigilosa()) {
            throw new AnonimaESigilosaException();
        }

        Optional<Denunciante> denuncianteAtual = denuncianteRepository.findByOcorrenciaId(id);
        DenuncianteRequest bloco = request.denunciante();
        boolean substituiDenunciante = false;
        if (bloco != null) {
            if (request.anonima()) {
                if (bloco.temAlgumDado()) {
                    throw new DenuncianteEmDenunciaAnonimaException();
                }
            } else {
                // Quem recebe o denunciante mascarado nao pode reenvia-lo: os
                // null da mascara apagariam os dados reais (D10).
                if (ocorrencia.isSigilosa() && !permissoes.podeVerSigilo()) {
                    throw new AccessDeniedException("Alterar denunciante sigiloso exige denunciante_sigiloso");
                }
                substituiDenunciante = true;
            }
        }
        if (identificando && (bloco == null || !bloco.temAlgumDado())) {
            throw new NomeDenuncianteObrigatorioException();
        }
        String nomeFinal = substituiDenunciante
                ? bloco.nome()
                : denuncianteAtual.map(Denunciante::getNome).orElse(null);
        validarNomeDenunciante(request.anonima(), request.sigilosa(), nomeFinal);

        ocorrencia.setTipoOcorrencia(resolverTipo(request.tipoOcorrencia()));
        ocorrencia.setDataAbertura(request.dataAbertura());
        ocorrencia.setHoraAbertura(request.horaAbertura());
        ocorrencia.setEndereco(request.endereco());
        ocorrencia.setBairro(request.bairro());
        ocorrencia.setPontoReferencia(request.pontoReferencia());
        ocorrencia.setDescricao(request.descricao());
        ocorrencia.setUrgente(request.urgente());
        ocorrencia.setSigilosa(request.sigilosa());
        ocorrencia.setAnonima(request.anonima());
        ocorrencia.setLatitude(request.latitude());
        ocorrencia.setLongitude(request.longitude());

        if (substituiDenunciante) {
            Denunciante denunciante = denuncianteAtual.orElseGet(() -> {
                Denunciante novo = new Denunciante();
                novo.setOcorrencia(ocorrencia);
                return novo;
            });
            aplicarDenunciante(denunciante, bloco);
            denuncianteRepository.save(denunciante);
        }
        DenunciadoRequest blocoDenunciado = request.denunciado();
        if (blocoDenunciado != null) {
            Optional<Denunciado> denunciadoAtual = denunciadoRepository.findByOcorrenciaId(id);
            if (denunciadoAtual.isPresent() || blocoDenunciado.temAlgumDado()) {
                Denunciado denunciado = denunciadoAtual.orElseGet(() -> {
                    Denunciado novo = new Denunciado();
                    novo.setOcorrencia(ocorrencia);
                    return novo;
                });
                aplicarDenunciado(denunciado, blocoDenunciado);
                denunciadoRepository.save(denunciado);
            }
        }

        ocorrenciaRepository.saveAndFlush(ocorrencia);
        auditoriaEventoService.registrar(autor, AcaoAuditoria.ATUALIZACAO, ENTIDADE_AUDITORIA, id,
                antes, ocorrenciaMapper.toSnapshot(ocorrencia, substituiDenunciante));

        return montarRespostaDeMutacao(ocorrencia, permissoes);
    }

    // ── Status ───────────────────────────────────────────

    // D5: por este caminho so ABERTA -> EM_ATENDIMENTO; o encerramento tem
    // endpoint proprio (providencia obrigatoria).
    @Transactional
    public OcorrenciaResponse alterarStatus(UUID id, AlterarStatusOcorrenciaRequest request, PermissoesOcorrencia permissoes) {
        if (request.status() != StatusOcorrencia.EM_ATENDIMENTO) {
            throw new TransicaoStatusInvalidaException();
        }
        Ocorrencia ocorrencia = travar(id);
        Usuario autor = buscarUsuario(permissoes.usuarioId());
        var antes = ocorrenciaMapper.toSnapshot(ocorrencia, false);

        StatusOcorrencia anterior = ocorrencia.iniciarAtendimento();
        registrarMovimentacao(ocorrencia, autor, TipoMovimentacaoOcorrencia.EQUIPE_DESPACHADA,
                anterior, ocorrencia.getStatusOcorrencia(), null);
        ocorrenciaRepository.saveAndFlush(ocorrencia);
        auditoriaEventoService.registrar(autor, AcaoAuditoria.ATUALIZACAO, ENTIDADE_AUDITORIA, id,
                antes, ocorrenciaMapper.toSnapshot(ocorrencia, false));

        return montarRespostaDeMutacao(ocorrencia, permissoes);
    }

    @Transactional
    public OcorrenciaResponse encerrar(UUID id, EncerrarOcorrenciaRequest request, PermissoesOcorrencia permissoes) {
        if (!StringUtils.hasText(request.providenciaTomada())) {
            throw new ProvidenciaObrigatoriaException();
        }
        Ocorrencia ocorrencia = travar(id);
        if (ocorrencia.isEncerrada()) {
            throw new TransicaoStatusInvalidaException();
        }
        ProvidenciaTomada providencia = providenciaTomadaRepository.findByCodigo(request.providenciaTomada())
                .filter(ProvidenciaTomada::isAtivo)
                .orElseThrow(ProvidenciaInvalidaException::new);
        String descricao = StringUtils.hasText(request.descricaoEncerramento())
                ? request.descricaoEncerramento().trim()
                : null;
        if (ProvidenciaTomada.CODIGO_OUTRO.equals(providencia.getCodigo()) && descricao == null) {
            throw new DescricaoEncerramentoObrigatoriaException();
        }
        // D12: nao encerra enquanto o processo vinculado nao estiver concluido.
        processoRepository.findByOcorrenciaId(id)
                .filter(p -> p.getStatusProcesso() != StatusProcesso.CONCLUIDO)
                .ifPresent(p -> {
                    throw new EncerramentoComProcessoPendenteException();
                });

        Usuario autor = buscarUsuario(permissoes.usuarioId());
        var antes = ocorrenciaMapper.toSnapshot(ocorrencia, false);

        StatusOcorrencia anterior = ocorrencia.encerrar(providencia, descricao, LocalDateTime.now(clock), autor);
        registrarMovimentacao(ocorrencia, autor, TipoMovimentacaoOcorrencia.ENCERRADA,
                anterior, ocorrencia.getStatusOcorrencia(), "Providência: " + providencia.getNome());
        ocorrenciaRepository.saveAndFlush(ocorrencia);
        auditoriaEventoService.registrar(autor, AcaoAuditoria.ENCERRAMENTO, ENTIDADE_AUDITORIA, id,
                antes, ocorrenciaMapper.toSnapshot(ocorrencia, false));

        return montarRespostaDeMutacao(ocorrencia, permissoes);
    }

    // D37: nota interna na timeline, sem mudanca de status. T43: a nota gera
    // CRIACAO da movimentacao; o texto nao entra no payload (texto livre, que
    // pode citar dado pessoal, e ja fica imutavel na propria movimentacao).
    @Transactional
    public OcorrenciaResponse adicionarNota(UUID id, CriarNotaRequest request, PermissoesOcorrencia permissoes) {
        Ocorrencia ocorrencia = travar(id);
        if (ocorrencia.isEncerrada()) {
            throw new OcorrenciaEncerradaException();
        }
        Usuario autor = buscarUsuario(permissoes.usuarioId());
        MovimentacaoOcorrencia nota = registrarMovimentacao(ocorrencia, autor, TipoMovimentacaoOcorrencia.NOTA_INTERNA,
                null, null, request.descricao().trim());
        auditoriaEventoService.registrar(autor, AcaoAuditoria.CRIACAO, ENTIDADE_MOVIMENTACAO, nota.getId(), null,
                Map.of("ocorrenciaId", id, "tipoMovimentacao", nota.getTipoMovimentacao()));
        return montarRespostaDeMutacao(ocorrencia, permissoes);
    }

    // ── Vinculo com processo ─────────────────────────────

    // D33: vincular altera a ocorrencia (movimentacao, urgencia), entao exige
    // escrita em ocorrencias alem do acesso ao endpoint.
    @Transactional
    public OcorrenciaResponse vincularProcesso(UUID ocorrenciaId, UUID processoId, PermissoesOcorrencia permissoes) {
        exigirEscritaEmOcorrencias(permissoes);
        Ocorrencia ocorrencia = travarParaVinculo(ocorrenciaId);
        ProcessoSanitario processo = processoRepository.findByIdForUpdate(processoId)
                .orElseThrow(ProcessoNaoEncontradoException::new);
        vincular(ocorrencia, processo, buscarUsuario(permissoes.usuarioId()));
        return montarRespostaDeMutacao(ocorrencia, permissoes);
    }

    public void exigirEscritaEmOcorrencias(PermissoesOcorrencia permissoes) {
        if (!permissoes.podeEscreverOcorrencias()) {
            throw new AccessDeniedException("Vincular processo exige OCORRENCIAS_DENUNCIAS:escrita");
        }
    }

    // Primeiro passo de todo vinculo (ordem de locks: ocorrencia antes do
    // processo). Usado tambem por ProcessoSanitarioService.criar antes de
    // inserir o processo novo.
    @Transactional
    public Ocorrencia travarParaVinculo(UUID ocorrenciaId) {
        Ocorrencia ocorrencia = travar(ocorrenciaId);
        if (ocorrencia.isEncerrada()) {
            throw new OcorrenciaEncerradaException();
        }
        if (processoRepository.findByOcorrenciaId(ocorrenciaId).isPresent()) {
            throw new VinculoJaExistenteException();
        }
        return ocorrencia;
    }

    // Pressupoe ocorrencia e processo ja travados, nessa ordem. O vinculo e
    // imutavel depois de gravado (DER regra 15): a entidade recusa um segundo
    // vinculo e o banco recusa troca ou remocao (V13). Ponto unico dos dois
    // caminhos de vinculo (POST /api/processos com ocorrenciaId e
    // POST /{id}/processo): a auditoria ATUALIZACAO registra antes/depois da
    // urgencia (D31).
    @Transactional
    public void vincular(Ocorrencia ocorrencia, ProcessoSanitario processo, Usuario autor) {
        var antes = ocorrenciaMapper.toSnapshot(ocorrencia, false);
        processo.vincularOcorrencia(ocorrencia);
        processoRepository.saveAndFlush(processo);
        // D31: o vinculo pode marcar a urgencia, nunca desmarcar.
        if (processo.isUrgente()) {
            ocorrencia.setUrgente(true);
        }
        registrarMovimentacao(ocorrencia, autor, TipoMovimentacaoOcorrencia.PROCESSO_VINCULADO,
                null, null, "Processo " + processo.getProtocolo() + " vinculado.");
        ocorrenciaRepository.saveAndFlush(ocorrencia);
        auditoriaEventoService.registrar(autor, AcaoAuditoria.ATUALIZACAO, ENTIDADE_AUDITORIA, ocorrencia.getId(),
                antes, ocorrenciaMapper.toSnapshot(ocorrencia, false));
    }

    // ── Anexos ───────────────────────────────────────────

    @Transactional
    public AnexoOcorrenciaResponse adicionarAnexo(UUID id, MultipartFile arquivo, PermissoesOcorrencia permissoes) {
        // D24: o lock vem antes da contagem, serializando uploads concorrentes.
        Ocorrencia ocorrencia = travar(id);
        if (ocorrencia.isEncerrada()) {
            throw new OcorrenciaEncerradaException();
        }
        byte[] conteudo = lerConteudo(arquivo);
        if (conteudo.length == 0 || conteudo.length > TAMANHO_MAXIMO_ANEXO) {
            throw new AnexoInvalidoException();
        }
        String mimeType = detectarTipo(conteudo);
        if (anexoRepository.countByOcorrenciaId(id) >= MAXIMO_ANEXOS) {
            throw new LimiteAnexosAtingidoException();
        }
        Usuario autor = buscarUsuario(permissoes.usuarioId());

        AnexoOcorrencia anexo = new AnexoOcorrencia();
        anexo.setOcorrencia(ocorrencia);
        anexo.setNome(nomeDoArquivo(arquivo.getOriginalFilename()));
        anexo.setMimeType(mimeType);
        anexo.setTamanho(conteudo.length);
        anexo.setCriadoPor(autor);
        anexoRepository.save(anexo);

        AnexoOcorrenciaConteudo registroConteudo = new AnexoOcorrenciaConteudo();
        registroConteudo.setAnexo(anexo);
        registroConteudo.setConteudo(conteudo);
        anexoConteudoRepository.save(registroConteudo);

        AnexoOcorrenciaResponse response = ocorrenciaMapper.toAnexoResponse(anexo);
        auditoriaEventoService.registrar(autor, AcaoAuditoria.CRIACAO, ENTIDADE_ANEXO, anexo.getId(), null, response);
        return response;
    }

    // D14/D30: em ocorrencia sigilosa (avaliado agora, no download), o
    // conteudo so sai para quem tem denunciante_sigiloso — e cada entrega gera
    // VISUALIZACAO (T26). Sem readOnly: numa transacao readOnly o INSERT da
    // auditoria (REQUIRED, participa desta) seria descartado sem erro
    // (FlushMode.MANUAL) ou recusado pelo PostgreSQL (25006). Na mesma
    // transacao, falha da auditoria desfaz tudo e o arquivo nao sai.
    //
    // T43: a recusa pelo sigilo grava ACESSO_NEGADO e so entao lanca o 403;
    // noRollbackFor mantem o evento (ate ali a transacao so leu). Vale porque
    // esta e a transacao mais externa (so o controller chama, sem
    // @Transactional, open-in-view desligado): dentro de outra transacao, o
    // rollback seria decidido pelas regras dela. Falha ao gravar o evento:
    // FalhaAuditoriaException (500), que nao esta no noRollbackFor.
    @Transactional(noRollbackFor = AccessDeniedException.class)
    public ArquivoAnexo baixarAnexo(UUID id, UUID anexoId, PermissoesOcorrencia permissoes) {
        Ocorrencia ocorrencia = ocorrenciaRepository.findById(id).orElseThrow(OcorrenciaNaoEncontradaException::new);
        AnexoOcorrencia anexo = anexoRepository.findByIdAndOcorrenciaId(anexoId, id)
                .orElseThrow(AnexoNaoEncontradoException::new);
        if (ocorrencia.isSigilosa() && !permissoes.podeVerSigilo()) {
            registrarAcessoNegado(permissoes, ENTIDADE_ANEXO, anexo.getId(), id);
            throw new AccessDeniedException("Anexo de ocorrencia sigilosa exige denunciante_sigiloso");
        }
        AnexoOcorrenciaConteudo conteudo = anexoConteudoRepository.findById(anexo.getId())
                .orElseThrow(AnexoNaoEncontradoException::new);
        if (ocorrencia.isSigilosa()) {
            registrarVisualizacao(permissoes, ENTIDADE_ANEXO, anexo.getId(), id);
        }
        return new ArquivoAnexo(anexo.getNome(), anexo.getMimeType(), conteudo.getConteudo());
    }

    // ── Consultas ────────────────────────────────────────

    // Ponto unico de leitura do detalhe. Quem recebe o denunciante completo
    // de ocorrencia sigilosa gera VISUALIZACAO (T26), uma por requisicao, sem
    // deduplicacao. Sem readOnly pelo mesmo motivo de baixarAnexo. T43: quem
    // le o modulo sem denunciante_sigiloso recebe o denunciante mascarado e
    // gera ACESSO_NEGADO (so quando ha denunciante cadastrado, como a
    // VISUALIZACAO).
    @Transactional
    public OcorrenciaResponse buscarPorId(UUID id, PermissoesOcorrencia permissoes) {
        Ocorrencia ocorrencia = ocorrenciaRepository.findDetalheById(id)
                .orElseThrow(OcorrenciaNaoEncontradaException::new);
        Denunciante denunciante = denuncianteRepository.findByOcorrenciaId(id).orElse(null);
        OcorrenciaResponse resposta = montarResposta(ocorrencia, denunciante, permissoes);
        if (ocorrencia.isSigilosa() && denunciante != null) {
            if (permissoes.podeVerSigilo()) {
                registrarVisualizacao(permissoes, ENTIDADE_DENUNCIANTE, denunciante.getId(), id);
            } else {
                registrarAcessoNegado(permissoes, ENTIDADE_DENUNCIANTE, denunciante.getId(), id);
            }
        }
        return resposta;
    }

    @Transactional(readOnly = true)
    public PaginaResponse<OcorrenciaResumoResponse> listar(String tipo, StatusOcorrencia status, String q,
            int pagina, int tamanho, PermissoesOcorrencia permissoes) {
        return listar(tipo, status, q, null, null, pagina, tamanho, permissoes);
    }

    // F2-010 (RF-E02): filtro por periodo da data de abertura (dias inclusivos).
    public PaginaResponse<OcorrenciaResumoResponse> listar(String tipo, StatusOcorrencia status, String q,
            LocalDate de, LocalDate ate, int pagina, int tamanho, PermissoesOcorrencia permissoes) {
        Page<Ocorrencia> paginaOcorrencias = ocorrenciaRepository.findAll(
                construirFiltro(tipo, status, q, de, ate),
                PageRequest.of(pagina, tamanho, ORDEM_LISTAGEM));

        List<UUID> ids = paginaOcorrencias.getContent().stream().map(Ocorrencia::getId).toList();
        Map<UUID, Denunciante> denunciantes = ids.isEmpty() ? Map.of()
                : denuncianteRepository.findByOcorrenciaIdIn(ids).stream()
                        .collect(Collectors.toMap(d -> d.getOcorrencia().getId(), Function.identity()));
        Map<UUID, ProcessoSanitario> processos = ids.isEmpty() ? Map.of()
                : processoRepository.findByOcorrenciaIdIn(ids).stream()
                        .collect(Collectors.toMap(p -> p.getOcorrencia().getId(), Function.identity()));

        // A listagem nao gera VISUALIZACAO: nao entrega dado de denunciante
        // de ocorrencia sigilosa a ninguem (o mapper devolve o nome null).
        return PaginaResponse.de(paginaOcorrencias.map(o -> ocorrenciaMapper.toResumo(
                o, denunciantes.get(o.getId()), processos.get(o.getId()), permissoes.podeVerSigilo())));
    }

    @Transactional(readOnly = true)
    public CatalogosOcorrenciaResponse catalogos() {
        return new CatalogosOcorrenciaResponse(
                tipoOcorrenciaRepository.findByAtivoTrueOrderByNomeAsc().stream()
                        .map(t -> new CatalogoItemResponse(t.getCodigo(), t.getNome())).toList(),
                providenciaTomadaRepository.findByAtivoTrueOrderByNomeAsc().stream()
                        .map(p -> new CatalogoItemResponse(p.getCodigo(), p.getNome())).toList());
    }

    // ── Apoio ────────────────────────────────────────────

    private OcorrenciaResponse montarResposta(Ocorrencia ocorrencia, PermissoesOcorrencia permissoes) {
        return montarResposta(ocorrencia, denuncianteRepository.findByOcorrenciaId(ocorrencia.getId()).orElse(null),
                permissoes, true);
    }

    private OcorrenciaResponse montarResposta(Ocorrencia ocorrencia, Denunciante denunciante,
            PermissoesOcorrencia permissoes) {
        return montarResposta(ocorrencia, denunciante, permissoes, true);
    }

    // A04: edicao, status, encerramento, notas e vinculo devolvem o
    // denunciante de ocorrencia sigilosa sempre mascarado, para qualquer
    // perfil. O dado completo so sai pelo detalhe e pelo download de anexo,
    // os dois caminhos que registram VISUALIZACAO.
    private OcorrenciaResponse montarRespostaDeMutacao(Ocorrencia ocorrencia, PermissoesOcorrencia permissoes) {
        return montarResposta(ocorrencia, denuncianteRepository.findByOcorrenciaId(ocorrencia.getId()).orElse(null),
                permissoes, false);
    }

    private OcorrenciaResponse montarResposta(Ocorrencia ocorrencia, Denunciante denunciante,
            PermissoesOcorrencia permissoes, boolean entregaDenunciante) {
        UUID id = ocorrencia.getId();
        return ocorrenciaMapper.toResponse(
                ocorrencia,
                denunciante,
                denunciadoRepository.findByOcorrenciaId(id).orElse(null),
                processoRepository.findByOcorrenciaId(id).orElse(null),
                movimentacaoRepository.findByOcorrenciaIdOrderByDataDescCriadoEmDesc(id),
                anexoRepository.findByOcorrenciaIdOrderByCriadoEmAsc(id),
                permissoes.podeVerSigilo(),
                entregaDenunciante);
    }

    private MovimentacaoOcorrencia registrarMovimentacao(Ocorrencia ocorrencia, Usuario autor,
            TipoMovimentacaoOcorrencia tipo, StatusOcorrencia anterior, StatusOcorrencia novo, String descricao) {
        MovimentacaoOcorrencia movimentacao = new MovimentacaoOcorrencia();
        movimentacao.setOcorrencia(ocorrencia);
        movimentacao.setUsuario(autor);
        movimentacao.setTipoMovimentacao(tipo);
        movimentacao.setStatusAnterior(anterior);
        movimentacao.setStatusNovo(novo);
        movimentacao.setData(LocalDateTime.now(clock));
        movimentacao.setDescricao(descricao);
        return movimentacaoRepository.save(movimentacao);
    }

    // T26: acesso autorizado a dado de denunciante sigiloso. O payload so leva
    // o id da ocorrencia — nenhum dado pessoal (D23).
    private void registrarVisualizacao(PermissoesOcorrencia permissoes, String entidade, UUID entidadeId,
            UUID ocorrenciaId) {
        auditoriaEventoService.registrar(buscarUsuario(permissoes.usuarioId()), AcaoAuditoria.VISUALIZACAO,
                entidade, entidadeId, null, Map.of("ocorrenciaId", ocorrenciaId));
    }

    // T43: acesso ao dado de denunciante sigiloso recusado pela regra de
    // sigilo. Mesmo payload da VISUALIZACAO (so o id da ocorrencia). Gravado
    // com flush antes da resposta: falha vira 500, nunca 409 nem entrega.
    private void registrarAcessoNegado(PermissoesOcorrencia permissoes, String entidade, UUID entidadeId,
            UUID ocorrenciaId) {
        auditoriaEventoService.registrarImediato(buscarUsuario(permissoes.usuarioId()), AcaoAuditoria.ACESSO_NEGADO,
                entidade, entidadeId, null, Map.of("ocorrenciaId", ocorrenciaId));
    }

    private Ocorrencia travar(UUID id) {
        return ocorrenciaRepository.findByIdForUpdate(id).orElseThrow(OcorrenciaNaoEncontradaException::new);
    }

    private Usuario buscarUsuario(UUID usuarioId) {
        return usuarioRepository.findById(usuarioId).orElseThrow(UsuarioNaoEncontradoException::new);
    }

    private TipoOcorrencia resolverTipo(String codigo) {
        return tipoOcorrenciaRepository.findByCodigo(codigo)
                .filter(TipoOcorrencia::isAtivo)
                .orElseThrow(TipoOcorrenciaInvalidoException::new);
    }

    // D21: com o Clock do projeto, nao com @PastOrPresent.
    private void validarDataAbertura(LocalDate dataAbertura) {
        if (dataAbertura.isAfter(LocalDate.now(clock))) {
            throw new DataAberturaFuturaException();
        }
    }

    // D32: anonima e sigilosa sao excludentes, e anonima nao aceita nenhum dado
    // do denunciante (nem telefone de retorno).
    private void validarAnonimato(boolean anonima, boolean sigilosa, DenuncianteRequest denunciante) {
        if (anonima && sigilosa) {
            throw new AnonimaESigilosaException();
        }
        if (anonima && denunciante != null && denunciante.temAlgumDado()) {
            throw new DenuncianteEmDenunciaAnonimaException();
        }
    }

    // D19: nome obrigatorio so quando a denuncia nao e anonima nem sigilosa.
    private void validarNomeDenunciante(boolean anonima, boolean sigilosa, String nome) {
        if (!anonima && !sigilosa && !StringUtils.hasText(nome)) {
            throw new NomeDenuncianteObrigatorioException();
        }
    }

    private void aplicarDenunciante(Denunciante denunciante, DenuncianteRequest request) {
        denunciante.setNome(request.nome());
        denunciante.setCpf(request.cpf());
        denunciante.setTelefone(request.telefone());
        denunciante.setEmail(request.email());
        denunciante.setCep(request.cep());
        denunciante.setEndereco(request.endereco());
        denunciante.setBairroResidencial(request.bairroResidencial());
    }

    private void aplicarDenunciado(Denunciado denunciado, DenunciadoRequest request) {
        denunciado.setNome(request.nome());
        denunciado.setCpf(request.cpf());
        denunciado.setTelefone(request.telefone());
        denunciado.setEndereco(request.endereco());
        denunciado.setObservacoes(request.observacoes());
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

    private static byte[] lerConteudo(MultipartFile arquivo) {
        try {
            return arquivo.getBytes();
        } catch (IOException e) {
            throw new AnexoInvalidoException();
        }
    }

    // O tipo vem dos bytes iniciais, nao do Content-Type informado pelo
    // cliente (que so reflete a extensao do arquivo).
    private static String detectarTipo(byte[] conteudo) {
        if (comecaCom(conteudo, 0xFF, 0xD8, 0xFF)) {
            return "image/jpeg";
        }
        if (comecaCom(conteudo, 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A)) {
            return "image/png";
        }
        if (comecaCom(conteudo, 0x25, 0x50, 0x44, 0x46, 0x2D)) {
            return "application/pdf";
        }
        throw new AnexoInvalidoException();
    }

    private static boolean comecaCom(byte[] conteudo, int... assinatura) {
        if (conteudo.length < assinatura.length) {
            return false;
        }
        for (int i = 0; i < assinatura.length; i++) {
            if ((conteudo[i] & 0xFF) != assinatura[i]) {
                return false;
            }
        }
        return true;
    }

    private static String nomeDoArquivo(String original) {
        String nome = StringUtils.hasText(original) ? StringUtils.getFilename(original.replace('\\', '/')) : null;
        nome = StringUtils.hasText(nome) ? nome.trim() : "anexo";
        return nome.length() > TAMANHO_MAXIMO_NOME_ANEXO ? nome.substring(0, TAMANHO_MAXIMO_NOME_ANEXO) : nome;
    }
}
