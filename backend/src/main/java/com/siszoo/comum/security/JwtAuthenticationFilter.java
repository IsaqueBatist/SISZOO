package com.siszoo.comum.security;

import java.io.IOException;
import java.util.List;
import java.util.Set;

import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import com.siszoo.usuarios.service.AutoridadeService;
import com.siszoo.usuarios.service.JwtService;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String PREFIXO_BEARER = "Bearer ";

    private final JwtService jwtService;
    private final AutoridadeService autoridadeService;

    public JwtAuthenticationFilter(JwtService jwtService, AutoridadeService autoridadeService) {
        this.jwtService = jwtService;
        this.autoridadeService = autoridadeService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String cabecalho = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (StringUtils.hasText(cabecalho) && cabecalho.startsWith(PREFIXO_BEARER)) {
            String token = cabecalho.substring(PREFIXO_BEARER.length()).trim();
            if (StringUtils.hasText(token)) {
                autenticarSePossivel(token);
            }
        }

        filterChain.doFilter(request, response);
    }

    private void autenticarSePossivel(String token) {
        try {
            Claims claims = jwtService.validarToken(token).getPayload();
            String usuarioId = claims.getSubject();
            @SuppressWarnings("unchecked")
            List<String> cargos = claims.get("cargos", List.class);
            Set<GrantedAuthority> autoridades = autoridadeService.resolverAutoridades(cargos);

            var autenticacao = new UsernamePasswordAuthenticationToken(usuarioId, null, autoridades);
            SecurityContextHolder.getContext().setAuthentication(autenticacao);
        } catch (JwtException | IllegalArgumentException e) {
            SecurityContextHolder.clearContext();
        }
    }
}
