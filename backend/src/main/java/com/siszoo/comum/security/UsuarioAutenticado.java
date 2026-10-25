package com.siszoo.comum.security;

import java.util.UUID;

import org.springframework.security.core.Authentication;

// O principal que o JwtAuthenticationFilter coloca no contexto e o id do
// usuario (subject do token). Ponto unico dessa convencao para os controllers.
public final class UsuarioAutenticado {

    private UsuarioAutenticado() {
    }

    public static UUID id(Authentication authentication) {
        return UUID.fromString(authentication.getName());
    }
}
