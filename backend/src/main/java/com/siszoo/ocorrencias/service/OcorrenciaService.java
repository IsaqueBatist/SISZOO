package com.siszoo.ocorrencias.service;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.siszoo.comum.service.ProtocoloService;
import com.siszoo.ocorrencias.dto.AlterarStatusOcorrenciaRequest;
import com.siszoo.ocorrencias.dto.AtualizarOcorrenciaRequest;
import com.siszoo.ocorrencias.dto.CriarNotaRequest;
import com.siszoo.ocorrencias.dto.CriarOcorrenciaRequest;
import com.siszoo.ocorrencias.dto.DenunciadoRequest;
import com.siszoo.ocorrencias.dto.DenuncianteRequest;
import com.siszoo.ocorrencias.dto.EncerrarOcorrenciaRequest;
import com.siszoo.ocorrencias.dto.OcorrenciaResponse;
import com.siszoo.ocorrencias.entity.Denunciado;
import com.siszoo.ocorrencias.entity.Denunciante;
import com.siszoo.ocorrencias.entity.MovimentacaoOcorrencia;
import com.siszoo.ocorrencias.entity.Ocorrencia;
import com.siszoo.ocorrencias.entity.ProvidenciaTomada;
import com.siszoo.ocorrencias.entity.StatusOcorrencia;
import com.siszoo.ocorrencias.entity.TipoMovimentacaoOcorrencia;
import com.siszoo.ocorrencias.entity.TipoOcorrencia;
import com.siszoo.ocorrencias.exception.AnonimaESigilosaException;
import com.siszoo.ocorrencias.exception.AnonimatoIrreversivelException;
import com.siszoo.ocorrencias.exception.DataAberturaFuturaException;
import com.siszoo.ocorrencias.exception.DenuncianteEmDenunciaAnonimaException;
import com.siszoo.ocorrencias.exception.DescricaoEncerramentoObrigatoriaException;
import com.siszoo.ocorrencias.exception.EncerramentoComProcessoPendenteException;
import com.siszoo.ocorrencias.exception.NomeDenuncianteObrigatorioException;
import com.siszoo.ocorrencias.exception.OcorrenciaNaoEncontradaException;
import com.siszoo.ocorrencias.exception.ProvidenciaInvalidaException;
import com.siszoo.ocorrencias.exception.ProvidenciaObrigatoriaException;
import com.siszoo.ocorrencias.exception.TipoOcorrenciaInvalidoException;
import com.siszoo.ocorrencias.exception.TransicaoStatusInvalidaException;
import com.siszoo.ocorrencias.exception.UrgenciaDefinidaPeloProcessoException;
import com.siszoo.ocorrencias.exception.VinculoJaExistenteException;
import com.siszoo.ocorrencias.mapper.OcorrenciaMapper;
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

@Service
public class OcorrenciaService {

    private static final String ENTIDADE_AUDITORIA = "ocorrencia";
    private static final String ENTIDADE_MOVIMENTACAO = "movimentacao_ocorrencia";

    private final OcorrenciaRepository ocorrenciaRepository;
    private final TipoOcorrenciaRepository tipoOcorrenciaRepository;
    private final ProvidenciaTomadaRepository providenciaTomadaRepository;
    private final DenuncianteRepository denuncianteRepository;
    private final DenunciadoRepository denunciadoRepository;
    private final MovimentacaoOcorrenciaRepository movimentacaoRepository;
    private final ProcessoSanitarioRepository processoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProtocoloService protocoloService;
    private final OcorrenciaMapper ocorrenciaMapper;
    private final MontadorRespostaOcorrencia montadorResposta;
    private final AuditoriaEventoService auditoriaEventoService;
    private final Clock clock;

    public OcorrenciaService(
            OcorrenciaRepository ocorrenciaRepository,
            TipoOcorrenciaRepository tipoOcorrenciaRepository,
            ProvidenciaTomadaRepository providenciaTomadaRepository,
            DenuncianteRepository denuncianteRepository,
            DenunciadoRepository denunciadoRepository,
            MovimentacaoOcorrenciaRepository movimentacaoRepository,
            ProcessoSanitarioRepository processoRepository,
            UsuarioRepository usuarioRepository,
            ProtocoloService protocoloService,
            OcorrenciaMapper ocorrenciaMapper,
            MontadorRespostaOcorrencia montadorResposta,
            AuditoriaEventoService auditoriaEventoService,
            Clock clock) {
        this.ocorrenciaRepository = ocorrenciaRepository;
        this.tipoOcorrenciaRepository = tipoOcorrenciaRepository;
        this.providenciaTomadaRepository = providenciaTomadaRepository;
        this.denuncianteRepository = denuncianteRepository;
        this.denunciadoRepository = denunciadoRepository;
        this.movimentacaoRepository = movimentacaoRepository;
        this.processoRepository = processoRepository;
        this.usuarioRepository = usuarioRepository;
        this.protocoloService = protocoloService;
        this.ocorrenciaMapper = ocorrenciaMapper;
        this.montadorResposta = montadorResposta;
        this.auditoriaEventoService = auditoriaEventoService;
        this.clock = clock;
    }

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
            salvarDenunciante(ocorrencia, Optional.empty(), request.denunciante());
        }
        if (request.denunciado() != null && request.denunciado().temAlgumDado()) {
            salvarDenunciado(ocorrencia, Optional.empty(), request.denunciado());
        }

        registrarMovimentacao(ocorrencia, autor, TipoMovimentacaoOcorrencia.REGISTRADA,
                null, StatusOcorrencia.ABERTA, null);
        auditoriaEventoService.registrar(autor, AcaoAuditoria.CRIACAO, ENTIDADE_AUDITORIA, ocorrencia.getId(),
                null, ocorrenciaMapper.toSnapshot(ocorrencia, temDenunciante));

        return montadorResposta.paraCriacao(ocorrencia, permissoes);
    }

    @Transactional
    public OcorrenciaResponse atualizar(UUID id, AtualizarOcorrenciaRequest request, PermissoesOcorrencia permissoes) {
        Ocorrencia ocorrencia = travar(id);
        ocorrencia.exigirAberta();
        validarDataAbertura(request.dataAbertura());
        Usuario autor = buscarUsuario(permissoes.usuarioId());
        var antes = ocorrenciaMapper.toSnapshot(ocorrencia, false);

        validarUrgenciaDoProcesso(ocorrencia, request.urgente());
        validarSigiloEAnonimato(ocorrencia, request, permissoes);

        DenuncianteRequest bloco = request.denunciante();
        boolean substituiDenunciante = bloco != null && !request.anonima();
        Optional<Denunciante> denuncianteAtual = denuncianteRepository.findByOcorrenciaId(id);
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
            salvarDenunciante(ocorrencia, denuncianteAtual, bloco);
        }
        DenunciadoRequest blocoDenunciado = request.denunciado();
        if (blocoDenunciado != null) {
            Optional<Denunciado> denunciadoAtual = denunciadoRepository.findByOcorrenciaId(id);
            if (denunciadoAtual.isPresent() || blocoDenunciado.temAlgumDado()) {
                salvarDenunciado(ocorrencia, denunciadoAtual, blocoDenunciado);
            }
        }

        ocorrenciaRepository.saveAndFlush(ocorrencia);
        auditoriaEventoService.registrar(autor, AcaoAuditoria.ATUALIZACAO, ENTIDADE_AUDITORIA, id,
                antes, ocorrenciaMapper.toSnapshot(ocorrencia, substituiDenunciante));

        return montadorResposta.paraMutacao(ocorrencia, permissoes);
    }

    private void validarUrgenciaDoProcesso(Ocorrencia ocorrencia, boolean urgente) {
        if (ocorrencia.isUrgente() && !urgente) {
            processoRepository.findByOcorrenciaId(ocorrencia.getId())
                    .filter(ProcessoSanitario::isUrgente)
                    .ifPresent(p -> {
                        throw new UrgenciaDefinidaPeloProcessoException();
                    });
        }
    }

    private void validarSigiloEAnonimato(Ocorrencia ocorrencia, AtualizarOcorrenciaRequest request,
            PermissoesOcorrencia permissoes) {
        if (ocorrencia.isSigilosa() != request.sigilosa() && !permissoes.podeVerSigilo()) {
            throw new AccessDeniedException("Alterar o sigilo exige denunciante_sigiloso");
        }

        boolean identificando = ocorrencia.isAnonima() && !request.anonima();
        if (!ocorrencia.isAnonima() && request.anonima()) {
            throw new AnonimatoIrreversivelException();
        }
        if (identificando && !permissoes.podeVerSigilo()) {
            throw new AccessDeniedException("Identificar denuncia anonima exige denunciante_sigiloso");
        }
        DenuncianteRequest bloco = request.denunciante();
        validarAnonimato(request.anonima(), request.sigilosa(), bloco);

        if (bloco != null && !request.anonima() && ocorrencia.isSigilosa() && !permissoes.podeVerSigilo()) {
            throw new AccessDeniedException("Alterar denunciante sigiloso exige denunciante_sigiloso");
        }
        if (identificando && (bloco == null || !bloco.temAlgumDado())) {
            throw new NomeDenuncianteObrigatorioException();
        }
    }

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

        return montadorResposta.paraMutacao(ocorrencia, permissoes);
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

        return montadorResposta.paraMutacao(ocorrencia, permissoes);
    }

    @Transactional
    public OcorrenciaResponse adicionarNota(UUID id, CriarNotaRequest request, PermissoesOcorrencia permissoes) {
        Ocorrencia ocorrencia = travar(id);
        ocorrencia.exigirAberta();
        Usuario autor = buscarUsuario(permissoes.usuarioId());
        MovimentacaoOcorrencia nota = registrarMovimentacao(ocorrencia, autor, TipoMovimentacaoOcorrencia.NOTA_INTERNA,
                null, null, request.descricao().trim());
        auditoriaEventoService.registrar(autor, AcaoAuditoria.CRIACAO, ENTIDADE_MOVIMENTACAO, nota.getId(), null,
                Map.of("ocorrenciaId", id, "tipoMovimentacao", nota.getTipoMovimentacao()));
        return montadorResposta.paraMutacao(ocorrencia, permissoes);
    }

    @Transactional
    public OcorrenciaResponse vincularProcesso(UUID ocorrenciaId, UUID processoId, PermissoesOcorrencia permissoes) {
        exigirEscritaEmOcorrencias(permissoes);
        Ocorrencia ocorrencia = travarParaVinculo(ocorrenciaId);
        ProcessoSanitario processo = processoRepository.findByIdForUpdate(processoId)
                .orElseThrow(ProcessoNaoEncontradoException::new);
        vincular(ocorrencia, processo, buscarUsuario(permissoes.usuarioId()));
        return montadorResposta.paraMutacao(ocorrencia, permissoes);
    }

    public void exigirEscritaEmOcorrencias(PermissoesOcorrencia permissoes) {
        if (!permissoes.podeEscreverOcorrencias()) {
            throw new AccessDeniedException("Vincular processo exige OCORRENCIAS_DENUNCIAS:escrita");
        }
    }

    @Transactional
    public Ocorrencia travarParaVinculo(UUID ocorrenciaId) {
        Ocorrencia ocorrencia = travar(ocorrenciaId);
        ocorrencia.exigirAberta();
        if (processoRepository.findByOcorrenciaId(ocorrenciaId).isPresent()) {
            throw new VinculoJaExistenteException();
        }
        return ocorrencia;
    }

    @Transactional
    public void vincular(Ocorrencia ocorrencia, ProcessoSanitario processo, Usuario autor) {
        var antes = ocorrenciaMapper.toSnapshot(ocorrencia, false);
        processo.vincularOcorrencia(ocorrencia);
        processoRepository.saveAndFlush(processo);
        if (processo.isUrgente()) {
            ocorrencia.setUrgente(true);
        }
        registrarMovimentacao(ocorrencia, autor, TipoMovimentacaoOcorrencia.PROCESSO_VINCULADO,
                null, null, "Processo " + processo.getProtocolo() + " vinculado.");
        ocorrenciaRepository.saveAndFlush(ocorrencia);
        auditoriaEventoService.registrar(autor, AcaoAuditoria.ATUALIZACAO, ENTIDADE_AUDITORIA, ocorrencia.getId(),
                antes, ocorrenciaMapper.toSnapshot(ocorrencia, false));
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

    private void validarDataAbertura(LocalDate dataAbertura) {
        if (dataAbertura.isAfter(LocalDate.now(clock))) {
            throw new DataAberturaFuturaException();
        }
    }

    private void validarAnonimato(boolean anonima, boolean sigilosa, DenuncianteRequest denunciante) {
        if (anonima && sigilosa) {
            throw new AnonimaESigilosaException();
        }
        if (anonima && denunciante != null && denunciante.temAlgumDado()) {
            throw new DenuncianteEmDenunciaAnonimaException();
        }
    }

    private void validarNomeDenunciante(boolean anonima, boolean sigilosa, String nome) {
        if (!anonima && !sigilosa && !StringUtils.hasText(nome)) {
            throw new NomeDenuncianteObrigatorioException();
        }
    }

    private void salvarDenunciante(Ocorrencia ocorrencia, Optional<Denunciante> existente, DenuncianteRequest dados) {
        Denunciante denunciante = existente.orElseGet(() -> {
            Denunciante novo = new Denunciante();
            novo.setOcorrencia(ocorrencia);
            return novo;
        });
        denunciante.setNome(dados.nome());
        denunciante.setCpf(dados.cpf());
        denunciante.setTelefone(dados.telefone());
        denunciante.setEmail(dados.email());
        denunciante.setCep(dados.cep());
        denunciante.setEndereco(dados.endereco());
        denunciante.setBairroResidencial(dados.bairroResidencial());
        denuncianteRepository.save(denunciante);
    }

    private void salvarDenunciado(Ocorrencia ocorrencia, Optional<Denunciado> existente, DenunciadoRequest dados) {
        Denunciado denunciado = existente.orElseGet(() -> {
            Denunciado novo = new Denunciado();
            novo.setOcorrencia(ocorrencia);
            return novo;
        });
        denunciado.setNome(dados.nome());
        denunciado.setCpf(dados.cpf());
        denunciado.setTelefone(dados.telefone());
        denunciado.setEndereco(dados.endereco());
        denunciado.setObservacoes(dados.observacoes());
        denunciadoRepository.save(denunciado);
    }
}
