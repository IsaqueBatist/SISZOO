package com.siszoo.usuarios.controller;

import java.util.UUID;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.siszoo.usuarios.dto.PreferenciaUsuarioRequest;
import com.siszoo.usuarios.dto.PreferenciaUsuarioResponse;
import com.siszoo.usuarios.service.PreferenciaUsuarioService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/usuarios/me/preferencias")
public class PreferenciaUsuarioController {

    private final PreferenciaUsuarioService preferenciaUsuarioService;

    public PreferenciaUsuarioController(PreferenciaUsuarioService preferenciaUsuarioService) {
        this.preferenciaUsuarioService = preferenciaUsuarioService;
    }

    @GetMapping
    public PreferenciaUsuarioResponse buscar(Authentication authentication) {
        return preferenciaUsuarioService.buscar(UUID.fromString(authentication.getName()));
    }

    @PatchMapping
    public PreferenciaUsuarioResponse atualizar(
            Authentication authentication, @Valid @RequestBody PreferenciaUsuarioRequest request) {
        return preferenciaUsuarioService.atualizar(UUID.fromString(authentication.getName()), request);
    }
}
