package com.siszoo.usuarios.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletResponse;

// Cookie do token de renovacao. Path restrito: so /api/auth recebe o cookie, os
// demais endpoints seguem so com Bearer e a API continua sem superficie de
// CSRF. Sem Max-Age: morre com o navegador; o prazo real e o do servidor.
@Component
public class CookieSessao {

    public static final String NOME = "siszoo_sessao";
    private static final String CAMINHO = "/api/auth";

    private final boolean seguro;
    private final String sameSite;

    public CookieSessao(
            @Value("${siszoo.sessao.cookie-secure}") boolean seguro,
            @Value("${siszoo.sessao.cookie-same-site}") String sameSite) {
        this.seguro = seguro;
        this.sameSite = sameSite;
    }

    public void gravar(HttpServletResponse response, String token) {
        response.addHeader(HttpHeaders.SET_COOKIE, base(token).build().toString());
    }

    public void apagar(HttpServletResponse response) {
        response.addHeader(HttpHeaders.SET_COOKIE, base("").maxAge(0).build().toString());
    }

    private ResponseCookie.ResponseCookieBuilder base(String valor) {
        return ResponseCookie.from(NOME, valor)
                .httpOnly(true)
                .secure(seguro)
                .sameSite(sameSite)
                .path(CAMINHO);
    }
}
