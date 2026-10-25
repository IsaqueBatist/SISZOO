package com.siszoo.usuarios.service;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.siszoo.comum.exception.CampoInvalidoException;
import com.siszoo.usuarios.dto.LoginRequest;
import com.siszoo.usuarios.dto.LoginResponse;
import com.siszoo.usuarios.dto.TrocarSenhaRequest;
import com.siszoo.usuarios.entity.AcaoAuditoria;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.exception.CredencialInvalidaException;
import com.siszoo.usuarios.exception.SenhasDivergentesException;
import com.siszoo.usuarios.mapper.UsuarioMapper;
import com.siszoo.usuarios.repository.UsuarioRepository;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UsuarioMapper usuarioMapper;
    private final AuditoriaEventoService auditoriaEventoService;
    private final Clock clock;

    public AuthService(
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            UsuarioMapper usuarioMapper,
            AuditoriaEventoService auditoriaEventoService,
            Clock clock) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.usuarioMapper = usuarioMapper;
        this.auditoriaEventoService = auditoriaEventoService;
        this.clock = clock;
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(request.email())
                .filter(Usuario::isAtivo)
                .filter(candidato -> passwordEncoder.matches(request.senha(), candidato.getSenha()))
                .orElseThrow(CredencialInvalidaException::new);

        auditoriaEventoService.registrar(usuario, AcaoAuditoria.LOGIN, "usuario", usuario.getId(), null, null);

        String token = jwtService.gerarToken(usuario);
        return new LoginResponse(token, usuarioMapper.toResponse(usuario));
    }

    @Transactional
    public void trocarSenha(UUID usuarioId, TrocarSenhaRequest request) {
        if (!request.novaSenha().equals(request.confirmarSenha())) {
            throw new SenhasDivergentesException();
        }

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(CredencialInvalidaException::new);
        PoliticaSenha.violacao(request.novaSenha(), usuario.getEmail(), usuario.getNome(), usuario.getSobrenome())
                .ifPresent(mensagem -> {
                    throw new CampoInvalidoException("novaSenha", mensagem);
                });

        // T43: o evento registra so a data da troca, nunca senha nem hash. A
        // data vai truncada em microssegundos, a precisao do timestamp do
        // PostgreSQL (que arredondaria os nanossegundos): assim o payload_depois
        // e o valor gravado, nao uma aproximacao dele.
        LocalDateTime alteradaAntes = usuario.getSenhaAlteradaEm();
        LocalDateTime alteradaAgora = LocalDateTime.now(clock).truncatedTo(ChronoUnit.MICROS);
        usuario.setSenha(passwordEncoder.encode(request.novaSenha()));
        usuario.setSenhaAlteradaEm(alteradaAgora);
        usuarioRepository.save(usuario);

        auditoriaEventoService.registrar(usuario, AcaoAuditoria.ATUALIZACAO, "usuario", usuario.getId(),
                Collections.singletonMap("senhaAlteradaEm", alteradaAntes),
                Collections.singletonMap("senhaAlteradaEm", alteradaAgora));
    }
}
