package com.siszoo.comum.security;

import java.util.UUID;

import org.springframework.security.core.Authentication;

public final class UsuarioAutenticado {

    private UsuarioAutenticado() {
    }

    public static UUID id(Authentication authentication) {
        return UUID.fromString(authentication.getName());
    }

    public static UUID sessao(Authentication authentication) {
        return UUID.fromString(authentication.getDetails().toString());
    }
}
