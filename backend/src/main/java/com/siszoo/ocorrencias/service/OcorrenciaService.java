package com.siszoo.ocorrencias.service;

import java.time.Clock;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.siszoo.comum.service.ProtocoloService;
import com.siszoo.ocorrencias.dto.AtualizarOcorrenciaRequest;
import com.siszoo.ocorrencias.dto.CriarOcorrenciaRequest;
import com.siszoo.ocorrencias.dto.DenuncianteRequest;
import com.siszoo.ocorrencias.dto.OcorrenciaResponse;
import com.siszoo.ocorrencias.entity.Denunciante;
import com.siszoo.ocorrencias.entity.Ocorrencia;
import com.siszoo.ocorrencias.entity.StatusOcorrencia;
import com.siszoo.ocorrencias.entity.TipoMovimentacaoOcorrencia;
import com.siszoo.ocorrencias.entity.TipoOcorrencia;
import com.siszoo.ocorrencias.exception.AnonimatoIrreversivelException;
import com.siszoo.ocorrencias.exception.DataAberturaFuturaException;
import com.siszoo.ocorrencias.exception.NomeDenuncianteObrigatorioException;
import com.siszoo.ocorrencias.exception.OcorrenciaNaoEncontradaException;
import com.siszoo.ocorrencias.exception.TipoOcorrenciaInvalidoException;
import com.siszoo.ocorrencias.repository.OcorrenciaRepository;
import com.siszoo.ocorrencias.repository.TipoOcorrenciaRepository;
import com.siszoo.usuarios.entity.AcaoAuditoria;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.exception.UsuarioNaoEncontradoException;
import com.siszoo.usuarios.repository.UsuarioRepository;

@Service
public class OcorrenciaService {

    private final OcorrenciaRepository ocorrenciaRepository;
    private final TipoOcorrenciaRepository tipoOcorrenciaRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProtocoloService protocoloService;
    private final PartesOcorrencia partes;
    private final VinculoOcorrenciaService vinculos;
    private final RegistroMovimentacaoOcorrencia movimentacoes;
    private final AuditoriaOcorrencia auditoria;
    private final MontadorRespostaOcorrencia montadorResposta;
    private final Clock clock;

    public OcorrenciaService(
            OcorrenciaRepository ocorrenciaRepository,
            TipoOcorrenciaRepository tipoOcorrenciaRepository,
            UsuarioRepository usuarioRepository,
            ProtocoloService protocoloService,
            PartesOcorrencia partes,
            VinculoOcorrenciaService vinculos,
            RegistroMovimentacaoOcorrencia movimentacoes,
            AuditoriaOcorrencia auditoria,
            MontadorRespostaOcorrencia montadorResposta,
            Clock clock) {
        this.ocorrenciaRepository = ocorrenciaRepository;
        this.tipoOcorrenciaRepository = tipoOcorrenciaRepository;
        this.usuarioRepository = usuarioRepository;
        this.protocoloService = protocoloService;
        this.partes = partes;
        this.vinculos = vinculos;
        this.movimentacoes = movimentacoes;
        this.auditoria = auditoria;
        this.montadorResposta = montadorResposta;
        this.clock = clock;
    }

    @Transactional
    public OcorrenciaResponse criar(CriarOcorrenciaRequest request, PermissoesOcorrencia permissoes) {
        validarDataAbertura(request.dataAbertura());
        partes.validarAnonimato(request.isAnonima(), request.isSigilosa(), request.denunciante());
        boolean temDenunciante = request.denunciante() != null && request.denunciante().temAlgumDado();
        partes.validarNomeDenunciante(request.isAnonima(), request.isSigilosa(),
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
        vinculos.definirAnimalNaCriacao(ocorrencia, request.animalId());
        ocorrenciaRepository.save(ocorrencia);

        if (temDenunciante) {
            partes.salvarDenunciante(ocorrencia, Optional.empty(), request.denunciante());
        }
        partes.registrarDenunciado(ocorrencia, request.denunciado());

        movimentacoes.registrar(ocorrencia, autor, TipoMovimentacaoOcorrencia.REGISTRADA,
                null, StatusOcorrencia.ABERTA, null);
        auditoria.registrar(autor, AcaoAuditoria.CRIACAO, ocorrencia, null, temDenunciante);

        return montadorResposta.paraCriacao(ocorrencia, permissoes);
    }

    @Transactional
    public OcorrenciaResponse atualizar(UUID id, AtualizarOcorrenciaRequest request, PermissoesOcorrencia permissoes) {
        Ocorrencia ocorrencia = ocorrenciaRepository.findByIdForUpdate(id)
                .orElseThrow(OcorrenciaNaoEncontradaException::new);
        ocorrencia.exigirAberta();
        validarDataAbertura(request.dataAbertura());
        Usuario autor = buscarUsuario(permissoes.usuarioId());
        var antes = auditoria.snapshot(ocorrencia);

        vinculos.exigirUrgenciaCompativel(ocorrencia, request.urgente());
        validarSigiloEAnonimato(ocorrencia, request, permissoes);

        DenuncianteRequest bloco = request.denunciante();
        boolean substituiDenunciante = bloco != null && !request.anonima();
        Optional<Denunciante> denuncianteAtual = partes.denuncianteDe(id);
        String nomeFinal = substituiDenunciante
                ? bloco.nome()
                : denuncianteAtual.map(Denunciante::getNome).orElse(null);
        partes.validarNomeDenunciante(request.anonima(), request.sigilosa(), nomeFinal);

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
            partes.salvarDenunciante(ocorrencia, denuncianteAtual, bloco);
        }
        partes.atualizarDenunciado(ocorrencia, request.denunciado());

        ocorrenciaRepository.saveAndFlush(ocorrencia);
        auditoria.registrar(autor, AcaoAuditoria.ATUALIZACAO, ocorrencia, antes, substituiDenunciante);

        return montadorResposta.paraMutacao(ocorrencia, permissoes);
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
        partes.validarAnonimato(request.anonima(), request.sigilosa(), bloco);

        if (bloco != null && !request.anonima() && ocorrencia.isSigilosa() && !permissoes.podeVerSigilo()) {
            throw new AccessDeniedException("Alterar denunciante sigiloso exige denunciante_sigiloso");
        }
        if (identificando && (bloco == null || !bloco.temAlgumDado())) {
            throw new NomeDenuncianteObrigatorioException();
        }
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
}
