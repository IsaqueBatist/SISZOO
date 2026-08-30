package com.siszoo.usuarios.controller;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.siszoo.usuarios.dto.LoginRequest;
import com.siszoo.usuarios.dto.LoginResponse;
import com.siszoo.usuarios.dto.TrocarSenhaRequest;
import com.siszoo.usuarios.service.AuthService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/senha")
    public ResponseEntity<Void> trocarSenha(Authentication authentication, @Valid @RequestBody TrocarSenhaRequest request) {
        authService.trocarSenha(UUID.fromString(authentication.getName()), request);
        return ResponseEntity.noContent().build();
    }
}
