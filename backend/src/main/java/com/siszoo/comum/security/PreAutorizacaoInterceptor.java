package com.siszoo.comum.security;

import org.aopalliance.intercept.MethodInvocation;
import org.springframework.context.ApplicationContext;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authorization.AuthorizationResult;
import org.springframework.security.authorization.method.PreAuthorizeAuthorizationManager;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.util.SimpleMethodInvocation;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

// O @Valid do @RequestBody e avaliado na resolucao dos argumentos, antes do
// @PreAuthorize do metodo: um perfil sem permissao que mandasse corpo invalido
// recebia 422 em vez de 403 (pendencia FS-P1). Este interceptor roda depois de
// achar o endpoint e antes de ler o corpo, avalia o mesmo @PreAuthorize com o
// gerente do @EnableMethodSecurity e lanca AccessDeniedException, tratada como
// sempre pelo ExceptionTranslationFilter -> JwtAccessDeniedHandler (403).
// A checagem por metodo continua valendo como segunda camada. Requisicao sem
// autenticacao nao chega aqui: o filtro ja respondeu 401.
@Component
public class PreAutorizacaoInterceptor implements HandlerInterceptor {

    private final PreAuthorizeAuthorizationManager autorizacao = new PreAuthorizeAuthorizationManager();

    public PreAutorizacaoInterceptor(ApplicationContext applicationContext) {
        autorizacao.setApplicationContext(applicationContext);
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!(handler instanceof HandlerMethod metodo)) {
            return true;
        }
        // Os @PreAuthorize do projeto so usam hasAuthority(...), sem argumentos
        // do metodo (#param): os argumentos ainda nao foram lidos aqui.
        MethodInvocation invocacao = new SimpleMethodInvocation(
                metodo.getBean(), metodo.getMethod(), new Object[metodo.getMethod().getParameterCount()]);
        AuthorizationResult resultado = autorizacao.authorize(
                () -> SecurityContextHolder.getContext().getAuthentication(), invocacao);
        // null: o metodo nao tem @PreAuthorize.
        if (resultado != null && !resultado.isGranted()) {
            throw new AccessDeniedException("Acesso negado");
        }
        return true;
    }
}
