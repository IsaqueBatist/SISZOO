package com.siszoo.ocorrencias.service;

import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.siszoo.usuarios.entity.AcaoAuditoria;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.exception.UsuarioNaoEncontradoException;
import com.siszoo.usuarios.repository.UsuarioRepository;
import com.siszoo.usuarios.service.AuditoriaEventoService;

@Component
public class AuditoriaSigiloOcorrencia {

    private final AuditoriaEventoService auditoriaEventoService;
    private final UsuarioRepository usuarioRepository;

    public AuditoriaSigiloOcorrencia(AuditoriaEventoService auditoriaEventoService, UsuarioRepository usuarioRepository) {
        this.auditoriaEventoService = auditoriaEventoService;
        this.usuarioRepository = usuarioRepository;
    }

    public void registrarVisualizacao(PermissoesOcorrencia permissoes, String entidade, UUID entidadeId,
            UUID ocorrenciaId) {
        auditoriaEventoService.registrar(autor(permissoes), AcaoAuditoria.VISUALIZACAO,
                entidade, entidadeId, null, Map.of("ocorrenciaId", ocorrenciaId));
    }

    public void registrarAcessoNegado(PermissoesOcorrencia permissoes, String entidade, UUID entidadeId,
            UUID ocorrenciaId) {
        auditoriaEventoService.registrarImediato(autor(permissoes), AcaoAuditoria.ACESSO_NEGADO,
                entidade, entidadeId, null, Map.of("ocorrenciaId", ocorrenciaId));
    }

    private Usuario autor(PermissoesOcorrencia permissoes) {
        return usuarioRepository.findById(permissoes.usuarioId()).orElseThrow(UsuarioNaoEncontradoException::new);
    }
}
