package com.siszoo.ocorrencias.service;

import java.util.UUID;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.siszoo.comum.anexo.ConteudoAnexo;
import com.siszoo.comum.dto.ArquivoAnexo;
import com.siszoo.ocorrencias.dto.AnexoOcorrenciaResponse;
import com.siszoo.ocorrencias.entity.AnexoOcorrencia;
import com.siszoo.ocorrencias.entity.AnexoOcorrenciaConteudo;
import com.siszoo.ocorrencias.entity.Ocorrencia;
import com.siszoo.ocorrencias.exception.AnexoInvalidoException;
import com.siszoo.ocorrencias.exception.AnexoNaoEncontradoException;
import com.siszoo.ocorrencias.exception.LimiteAnexosAtingidoException;
import com.siszoo.ocorrencias.exception.OcorrenciaNaoEncontradaException;
import com.siszoo.ocorrencias.mapper.OcorrenciaMapper;
import com.siszoo.ocorrencias.repository.AnexoOcorrenciaConteudoRepository;
import com.siszoo.ocorrencias.repository.AnexoOcorrenciaRepository;
import com.siszoo.ocorrencias.repository.OcorrenciaRepository;
import com.siszoo.usuarios.entity.AcaoAuditoria;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.exception.UsuarioNaoEncontradoException;
import com.siszoo.usuarios.repository.UsuarioRepository;
import com.siszoo.usuarios.service.AuditoriaEventoService;

// Anexos da ocorrencia (T25, D9/D24): JPG/PNG/PDF ate 5 MB (ConteudoAnexo),
// ate 5 por ocorrencia, conteudo em tabela propria. O download de ocorrencia
// sigilosa segue a regra de sigilo do denunciante (D14/D30, T26/T43).
@Service
public class AnexoOcorrenciaService {

    private static final String ENTIDADE_ANEXO = "anexo_ocorrencia";
    private static final int MAXIMO_ANEXOS = 5;

    private final OcorrenciaRepository ocorrenciaRepository;
    private final AnexoOcorrenciaRepository anexoRepository;
    private final AnexoOcorrenciaConteudoRepository anexoConteudoRepository;
    private final UsuarioRepository usuarioRepository;
    private final OcorrenciaMapper ocorrenciaMapper;
    private final AuditoriaEventoService auditoriaEventoService;
    private final AuditoriaSigiloOcorrencia auditoriaSigilo;

    public AnexoOcorrenciaService(
            OcorrenciaRepository ocorrenciaRepository,
            AnexoOcorrenciaRepository anexoRepository,
            AnexoOcorrenciaConteudoRepository anexoConteudoRepository,
            UsuarioRepository usuarioRepository,
            OcorrenciaMapper ocorrenciaMapper,
            AuditoriaEventoService auditoriaEventoService,
            AuditoriaSigiloOcorrencia auditoriaSigilo) {
        this.ocorrenciaRepository = ocorrenciaRepository;
        this.anexoRepository = anexoRepository;
        this.anexoConteudoRepository = anexoConteudoRepository;
        this.usuarioRepository = usuarioRepository;
        this.ocorrenciaMapper = ocorrenciaMapper;
        this.auditoriaEventoService = auditoriaEventoService;
        this.auditoriaSigilo = auditoriaSigilo;
    }

    @Transactional
    public AnexoOcorrenciaResponse adicionarAnexo(UUID id, MultipartFile arquivo, PermissoesOcorrencia permissoes) {
        // D24: o lock vem antes da contagem, serializando uploads concorrentes.
        Ocorrencia ocorrencia = ocorrenciaRepository.findByIdForUpdate(id)
                .orElseThrow(OcorrenciaNaoEncontradaException::new);
        ocorrencia.exigirAberta();
        ConteudoAnexo.Validado validado = ConteudoAnexo.validar(arquivo, AnexoInvalidoException::new);
        byte[] conteudo = validado.conteudo();
        if (anexoRepository.countByOcorrenciaId(id) >= MAXIMO_ANEXOS) {
            throw new LimiteAnexosAtingidoException();
        }
        Usuario autor = usuarioRepository.findById(permissoes.usuarioId())
                .orElseThrow(UsuarioNaoEncontradoException::new);

        AnexoOcorrencia anexo = new AnexoOcorrencia();
        anexo.setOcorrencia(ocorrencia);
        anexo.setNome(ConteudoAnexo.nomeDoArquivo(arquivo.getOriginalFilename()));
        anexo.setMimeType(validado.mimeType());
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
    // @Transactional, open-in-view desligado) e porque o 403 e lancado aqui,
    // nao dentro de outro metodo transacional (que marcaria a transacao como
    // rollback-only): dentro de outra transacao, o rollback seria decidido
    // pelas regras dela. Falha ao gravar o evento: FalhaAuditoriaException
    // (500), que nao esta no noRollbackFor.
    @Transactional(noRollbackFor = AccessDeniedException.class)
    public ArquivoAnexo baixarAnexo(UUID id, UUID anexoId, PermissoesOcorrencia permissoes) {
        Ocorrencia ocorrencia = ocorrenciaRepository.findById(id).orElseThrow(OcorrenciaNaoEncontradaException::new);
        AnexoOcorrencia anexo = anexoRepository.findByIdAndOcorrenciaId(anexoId, id)
                .orElseThrow(AnexoNaoEncontradoException::new);
        if (ocorrencia.isSigilosa() && !permissoes.podeVerSigilo()) {
            auditoriaSigilo.registrarAcessoNegado(permissoes, ENTIDADE_ANEXO, anexo.getId(), id);
            throw new AccessDeniedException("Anexo de ocorrencia sigilosa exige denunciante_sigiloso");
        }
        AnexoOcorrenciaConteudo conteudo = anexoConteudoRepository.findById(anexo.getId())
                .orElseThrow(AnexoNaoEncontradoException::new);
        if (ocorrencia.isSigilosa()) {
            auditoriaSigilo.registrarVisualizacao(permissoes, ENTIDADE_ANEXO, anexo.getId(), id);
        }
        return new ArquivoAnexo(anexo.getNome(), anexo.getMimeType(), conteudo.getConteudo());
    }
}
