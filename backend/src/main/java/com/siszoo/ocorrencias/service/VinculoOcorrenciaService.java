package com.siszoo.ocorrencias.service;

import java.util.UUID;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.siszoo.animais.entity.Animal;
import com.siszoo.animais.exception.AnimalNaoEncontradoException;
import com.siszoo.animais.repository.AnimalRepository;
import com.siszoo.ocorrencias.dto.OcorrenciaResponse;
import com.siszoo.ocorrencias.entity.Ocorrencia;
import com.siszoo.ocorrencias.entity.TipoMovimentacaoOcorrencia;
import com.siszoo.ocorrencias.exception.AnimalJaVinculadoException;
import com.siszoo.ocorrencias.exception.EncerramentoComProcessoPendenteException;
import com.siszoo.ocorrencias.exception.OcorrenciaNaoEncontradaException;
import com.siszoo.ocorrencias.exception.UrgenciaDefinidaPeloProcessoException;
import com.siszoo.ocorrencias.exception.VinculoJaExistenteException;
import com.siszoo.ocorrencias.repository.OcorrenciaRepository;
import com.siszoo.processos.entity.ProcessoSanitario;
import com.siszoo.processos.entity.StatusProcesso;
import com.siszoo.processos.exception.ProcessoNaoEncontradoException;
import com.siszoo.processos.repository.ProcessoSanitarioRepository;
import com.siszoo.usuarios.entity.AcaoAuditoria;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.exception.UsuarioNaoEncontradoException;
import com.siszoo.usuarios.repository.UsuarioRepository;

@Service
public class VinculoOcorrenciaService {

    private final OcorrenciaRepository ocorrenciaRepository;
    private final ProcessoSanitarioRepository processoRepository;
    private final AnimalRepository animalRepository;
    private final UsuarioRepository usuarioRepository;
    private final RegistroMovimentacaoOcorrencia movimentacoes;
    private final AuditoriaOcorrencia auditoria;
    private final MontadorRespostaOcorrencia montadorResposta;

    public VinculoOcorrenciaService(
            OcorrenciaRepository ocorrenciaRepository,
            ProcessoSanitarioRepository processoRepository,
            AnimalRepository animalRepository,
            UsuarioRepository usuarioRepository,
            RegistroMovimentacaoOcorrencia movimentacoes,
            AuditoriaOcorrencia auditoria,
            MontadorRespostaOcorrencia montadorResposta) {
        this.ocorrenciaRepository = ocorrenciaRepository;
        this.processoRepository = processoRepository;
        this.animalRepository = animalRepository;
        this.usuarioRepository = usuarioRepository;
        this.movimentacoes = movimentacoes;
        this.auditoria = auditoria;
        this.montadorResposta = montadorResposta;
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

    @Transactional
    public OcorrenciaResponse vincularAnimal(UUID ocorrenciaId, UUID animalId, PermissoesOcorrencia permissoes) {
        Ocorrencia ocorrencia = ocorrenciaRepository.findByIdForUpdate(ocorrenciaId)
                .orElseThrow(OcorrenciaNaoEncontradaException::new);
        Animal animal = resolverAnimalLivre(animalId, ocorrenciaId);
        var antes = auditoria.snapshot(ocorrencia);
        if (ocorrencia.vincularAnimal(animal)) {
            ocorrenciaRepository.saveAndFlush(ocorrencia);
            auditoria.registrar(buscarUsuario(permissoes.usuarioId()), AcaoAuditoria.ATUALIZACAO, ocorrencia,
                    antes, false);
        }
        return montadorResposta.paraMutacao(ocorrencia, permissoes);
    }

    public void definirAnimalNaCriacao(Ocorrencia ocorrencia, UUID animalId) {
        if (animalId != null) {
            ocorrencia.vincularAnimal(resolverAnimalLivre(animalId, null));
        }
    }

    public void exigirUrgenciaCompativel(Ocorrencia ocorrencia, boolean urgente) {
        if (ocorrencia.isUrgente() && !urgente) {
            processoRepository.findByOcorrenciaId(ocorrencia.getId())
                    .filter(ProcessoSanitario::isUrgente)
                    .ifPresent(p -> {
                        throw new UrgenciaDefinidaPeloProcessoException();
                    });
        }
    }

    public void exigirProcessoConcluido(UUID ocorrenciaId) {
        processoRepository.findByOcorrenciaId(ocorrenciaId)
                .filter(p -> p.getStatusProcesso() != StatusProcesso.CONCLUIDO)
                .ifPresent(p -> {
                    throw new EncerramentoComProcessoPendenteException();
                });
    }

    public void exigirEscritaEmOcorrencias(PermissoesOcorrencia permissoes) {
        if (!permissoes.podeEscreverOcorrencias()) {
            throw new AccessDeniedException("Vincular processo exige OCORRENCIAS_DENUNCIAS:escrita");
        }
    }

    @Transactional
    public Ocorrencia travarParaVinculo(UUID ocorrenciaId) {
        Ocorrencia ocorrencia = ocorrenciaRepository.findByIdForUpdate(ocorrenciaId)
                .orElseThrow(OcorrenciaNaoEncontradaException::new);
        ocorrencia.exigirAberta();
        if (processoRepository.findByOcorrenciaId(ocorrenciaId).isPresent()) {
            throw new VinculoJaExistenteException();
        }
        return ocorrencia;
    }

    @Transactional
    public void vincular(Ocorrencia ocorrencia, ProcessoSanitario processo, Usuario autor) {
        var antes = auditoria.snapshot(ocorrencia);
        processo.vincularOcorrencia(ocorrencia);
        processoRepository.saveAndFlush(processo);
        if (processo.isUrgente()) {
            ocorrencia.setUrgente(true);
        }
        movimentacoes.registrar(ocorrencia, autor, TipoMovimentacaoOcorrencia.PROCESSO_VINCULADO,
                null, null, "Processo " + processo.getProtocolo() + " vinculado.");
        ocorrenciaRepository.saveAndFlush(ocorrencia);
        auditoria.registrar(autor, AcaoAuditoria.ATUALIZACAO, ocorrencia, antes, false);
    }

    private Animal resolverAnimalLivre(UUID animalId, UUID ocorrenciaAtualId) {
        Animal animal = animalRepository.findById(animalId).orElseThrow(AnimalNaoEncontradoException::new);
        ocorrenciaRepository.findByAnimal_Id(animalId)
                .filter(outra -> !outra.getId().equals(ocorrenciaAtualId))
                .ifPresent(outra -> {
                    throw new AnimalJaVinculadoException(outra.getProtocolo());
                });
        return animal;
    }

    private Usuario buscarUsuario(UUID usuarioId) {
        return usuarioRepository.findById(usuarioId).orElseThrow(UsuarioNaoEncontradoException::new);
    }
}
