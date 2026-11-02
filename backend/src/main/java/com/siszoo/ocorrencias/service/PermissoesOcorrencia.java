package com.siszoo.ocorrencias.service;

import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;

import com.siszoo.comum.security.UsuarioAutenticado;

public record PermissoesOcorrencia(UUID usuarioId, boolean podeVerSigilo, boolean podeEscreverOcorrencias) {

    public static final String SIGILO = "OCORRENCIAS_DENUNCIAS:denunciante_sigiloso:leitura";
    public static final String ESCRITA = "OCORRENCIAS_DENUNCIAS:escrita";

    public static PermissoesOcorrencia de(Authentication authentication) {
        Set<String> autoridades = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());
        return new PermissoesOcorrencia(
                UsuarioAutenticado.id(authentication),
                autoridades.contains(SIGILO),
                autoridades.contains(ESCRITA));
    }
}
