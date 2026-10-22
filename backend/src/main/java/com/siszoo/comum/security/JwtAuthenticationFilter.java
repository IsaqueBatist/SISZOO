package com.siszoo.comum.security;

import java.io.IOException;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import com.siszoo.usuarios.repository.UsuarioRepository;
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
    private final UsuarioRepository usuarioRepository;

    public JwtAuthenticationFilter(
            JwtService jwtService, AutoridadeService autoridadeService, UsuarioRepository usuarioRepository) {
        this.jwtService = jwtService;
        this.autoridadeService = autoridadeService;
        this.usuarioRepository = usuarioRepository;
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

    // Por padrao OncePerRequestFilter pula o re-dispatch de erro (ex.: o
    // sendError(405) que o Spring MVC dispara para verbo nao mapeado): sem
    // isso, o SecurityContext fica vazio nesse segundo passe pelo filter
    // chain e o AuthorizationFilter troca o 405 correto por 401. Refazendo
    // a autenticacao tambem no dispatch de erro mantem o status original.
    @Override
    protected boolean shouldNotFilterErrorDispatch() {
        return false;
    }

    private void autenticarSePossivel(String token) {
        try {
            Claims claims = jwtService.validarToken(token).getPayload();
            String usuarioId = claims.getSubject();
            // Token valido nao basta: o usuario desativado (ou removido) depois
            // da emissao perde o acesso na hora, sem esperar a expiracao. Sem
            // autenticacao, as rotas protegidas respondem 401 (entry point),
            // como com token invalido. Uma consulta por requisicao, sem cache
            // (volume baixo do CCZ).
            if (usuarioId == null || !usuarioRepository.existsByIdAndAtivoTrue(UUID.fromString(usuarioId))) {
                SecurityContextHolder.clearContext();
                return;
            }
            // Erasure: a API de claims do jjwt so oferece get(key, Class<T>), sem
            // variante parametrizada para List<String> — o cast e inevitavel aqui.
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
