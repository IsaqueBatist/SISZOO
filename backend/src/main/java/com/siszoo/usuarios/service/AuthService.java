package com.siszoo.usuarios.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.siszoo.usuarios.dto.LoginRequest;
import com.siszoo.usuarios.dto.LoginResponse;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.exception.CredencialInvalidaException;
import com.siszoo.usuarios.mapper.UsuarioMapper;
import com.siszoo.usuarios.repository.UsuarioRepository;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UsuarioMapper usuarioMapper;

    public AuthService(
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            UsuarioMapper usuarioMapper) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.usuarioMapper = usuarioMapper;
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        Usuario usuario = usuarioRepository.findByEmail(request.email())
                .filter(Usuario::isAtivo)
                .filter(candidato -> passwordEncoder.matches(request.senha(), candidato.getSenha()))
                .orElseThrow(CredencialInvalidaException::new);

        String token = jwtService.gerarToken(usuario);
        return new LoginResponse(token, usuarioMapper.toResponse(usuario));
    }
}
