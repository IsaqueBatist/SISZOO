package com.siszoo.usuarios.service;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.siszoo.usuarios.dto.PreferenciaUsuarioRequest;
import com.siszoo.usuarios.dto.PreferenciaUsuarioResponse;
import com.siszoo.usuarios.entity.AcaoAuditoria;
import com.siszoo.usuarios.entity.PreferenciaUsuario;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.exception.NotificacaoCriticaObrigatoriaException;
import com.siszoo.usuarios.exception.UsuarioNaoEncontradoException;
import com.siszoo.usuarios.mapper.PreferenciaUsuarioMapper;
import com.siszoo.usuarios.repository.PreferenciaUsuarioRepository;
import com.siszoo.usuarios.repository.UsuarioRepository;

@Service
public class PreferenciaUsuarioService {

    private final PreferenciaUsuarioRepository preferenciaUsuarioRepository;
    private final UsuarioRepository usuarioRepository;
    private final PreferenciaUsuarioMapper preferenciaUsuarioMapper;
    private final AuditoriaEventoService auditoriaEventoService;

    public PreferenciaUsuarioService(
            PreferenciaUsuarioRepository preferenciaUsuarioRepository,
            UsuarioRepository usuarioRepository,
            PreferenciaUsuarioMapper preferenciaUsuarioMapper,
            AuditoriaEventoService auditoriaEventoService) {
        this.preferenciaUsuarioRepository = preferenciaUsuarioRepository;
        this.usuarioRepository = usuarioRepository;
        this.preferenciaUsuarioMapper = preferenciaUsuarioMapper;
        this.auditoriaEventoService = auditoriaEventoService;
    }

    @Transactional
    public PreferenciaUsuarioResponse buscar(UUID usuarioId) {
        PreferenciaUsuario preferencias = preferenciaUsuarioRepository.findByUsuarioId(usuarioId)
                .orElseGet(() -> criarPreferenciasPadrao(usuarioId));
        return preferenciaUsuarioMapper.toResponse(preferencias);
    }

    @Transactional
    public PreferenciaUsuarioResponse atualizar(UUID usuarioId, PreferenciaUsuarioRequest request) {
        if (Boolean.FALSE.equals(request.notifAlertasCriticos())) {
            throw new NotificacaoCriticaObrigatoriaException();
        }

        PreferenciaUsuario preferencias = preferenciaUsuarioRepository.findByUsuarioId(usuarioId)
                .orElseGet(() -> criarPreferenciasPadrao(usuarioId));

        preferencias.setTema(request.tema());
        preferencias.setDensidade(request.densidade());
        preferencias.setNotifAlertasCriticos(true);
        preferencias.setNotifVacinaVencendo(request.notifVacinaVencendo());
        preferencias.setNotifSuperlotacao(request.notifSuperlotacao());
        preferencias.setNotifResultadoLab(request.notifResultadoLab());
        preferencias.setNotifEmailDiario(request.notifEmailDiario());
        preferenciaUsuarioRepository.save(preferencias);

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(UsuarioNaoEncontradoException::new);
        PreferenciaUsuarioResponse response = preferenciaUsuarioMapper.toResponse(preferencias);
        auditoriaEventoService.registrar(usuario, AcaoAuditoria.ATUALIZACAO, "preferencia_usuario", null, response);

        return response;
    }

    // Usuários criados fora de UsuarioService.criar() (ex.: admin do
    // DataSeeder, que só grava usuario + usuario_cargo) não ganham uma linha
    // em preferencia_usuario automaticamente. Em vez de 404 em GET/PATCH
    // /me/preferencias para esses casos, criamos a linha com os defaults da
    // entity na primeira leitura/gravação.
    private PreferenciaUsuario criarPreferenciasPadrao(UUID usuarioId) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(UsuarioNaoEncontradoException::new);
        PreferenciaUsuario preferencias = new PreferenciaUsuario();
        preferencias.setUsuario(usuario);
        return preferenciaUsuarioRepository.save(preferencias);
    }
}
