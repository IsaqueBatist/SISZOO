package com.siszoo.comum.security;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import com.siszoo.comum.dto.ErroResponse;
import com.siszoo.usuarios.service.AutoridadeService;
import com.siszoo.usuarios.service.JwtService;
import com.siszoo.usuarios.service.SessaoService;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.DispatcherType;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import tools.jackson.databind.ObjectMapper;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String PREFIXO_BEARER = "Bearer ";
    private static final List<String> ROTAS_DA_SENHA_TEMPORARIA = List.of("/api/auth/", "/api/usuarios/me");
    private static final String MENSAGEM_SENHA_TEMPORARIA = "Troque a sua senha temporária para continuar.";

    private final JwtService jwtService;
    private final AutoridadeService autoridadeService;
    private final SessaoService sessaoService;
    private final ObjectMapper objectMapper;

    public JwtAuthenticationFilter(JwtService jwtService, AutoridadeService autoridadeService,
            SessaoService sessaoService, ObjectMapper objectMapper) {
        this.jwtService = jwtService;
        this.autoridadeService = autoridadeService;
        this.sessaoService = sessaoService;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String cabecalho = request.getHeader(HttpHeaders.AUTHORIZATION);

        if (StringUtils.hasText(cabecalho) && cabecalho.startsWith(PREFIXO_BEARER)) {
            String token = cabecalho.substring(PREFIXO_BEARER.length()).trim();
            if (StringUtils.hasText(token) && !autenticarOuRecusar(token, request, response)) {
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilterErrorDispatch() {
        return false;
    }

    private boolean autenticarOuRecusar(String token, HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        try {
            Claims claims = jwtService.validarToken(token).getPayload();
            String usuarioId = claims.getSubject();
            String sessaoId = JwtService.sessaoDe(claims);
            Optional<Boolean> senhaTemporaria = usuarioId == null || sessaoId == null
                    ? Optional.empty()
                    : sessaoService.senhaTemporariaDaSessaoAtiva(UUID.fromString(sessaoId), UUID.fromString(usuarioId));
            if (senhaTemporaria.isEmpty()) {
                SecurityContextHolder.clearContext();
                return true;
            }
            if (senhaTemporaria.get() && !rotaDaSenhaTemporaria(request)) {
                recusarPorSenhaTemporaria(response);
                return false;
            }
            @SuppressWarnings("unchecked")
            List<String> cargos = claims.get("cargos", List.class);
            Set<GrantedAuthority> autoridades = autoridadeService.resolverAutoridades(cargos);

            var autenticacao = new UsernamePasswordAuthenticationToken(usuarioId, null, autoridades);
            autenticacao.setDetails(sessaoId);
            SecurityContextHolder.getContext().setAuthentication(autenticacao);
        } catch (JwtException | IllegalArgumentException e) {
            SecurityContextHolder.clearContext();
        }
        return true;
    }

    private static boolean rotaDaSenhaTemporaria(HttpServletRequest request) {
        return request.getDispatcherType() != DispatcherType.REQUEST
                || ROTAS_DA_SENHA_TEMPORARIA.stream().anyMatch(request.getRequestURI()::startsWith);
    }

    private void recusarPorSenhaTemporaria(HttpServletResponse response) throws IOException {
        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(response.getOutputStream(), new ErroResponse(MENSAGEM_SENHA_TEMPORARIA));
    }
}
