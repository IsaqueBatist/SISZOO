package com.siszoo.comum.security;

import java.lang.reflect.Method;

import org.aopalliance.intercept.MethodInvocation;
import org.springframework.context.ApplicationContext;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
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
//
// Limite: aqui os argumentos do metodo ainda nao foram lidos. Um @PreAuthorize
// que use argumentos (#param, #root...) seria avaliado com tudo nulo e daria
// um resultado errado sem aviso. Por isso ele e recusado de forma explicita
// (IllegalStateException), e PreAuthorizeSemArgumentosTest quebra o build se
// algum controller usar "#".
@Component
public class PreAutorizacaoInterceptor implements HandlerInterceptor {

    private final PreAuthorizeAuthorizationManager autorizacao = new PreAuthorizeAuthorizationManager();

    public PreAutorizacaoInterceptor(ApplicationContext applicationContext) {
        autorizacao.setApplicationContext(applicationContext);
    }

    // Expressao do @PreAuthorize que vale para o metodo (no metodo ou, na
    // falta dele, na classe), ou null se nao houver.
    static String expressaoPreAuthorize(Method metodo, Class<?> classe) {
        PreAuthorize anotacao = AnnotatedElementUtils.findMergedAnnotation(metodo, PreAuthorize.class);
        if (anotacao == null) {
            anotacao = AnnotatedElementUtils.findMergedAnnotation(classe, PreAuthorize.class);
        }
        return anotacao == null ? null : anotacao.value();
    }

    static boolean usaArgumentosDoMetodo(String expressao) {
        return expressao != null && expressao.contains("#");
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        if (!(handler instanceof HandlerMethod metodo)) {
            return true;
        }
        String expressao = expressaoPreAuthorize(metodo.getMethod(), metodo.getBeanType());
        if (expressao == null) {
            return true;
        }
        if (usaArgumentosDoMetodo(expressao)) {
            throw new IllegalStateException("@PreAuthorize com argumentos do metodo nao e suportado pelo "
                    + "PreAutorizacaoInterceptor (" + metodo.getShortLogMessage() + ": " + expressao + ")");
        }
        MethodInvocation invocacao = new SimpleMethodInvocation(
                metodo.getBean(), metodo.getMethod(), new Object[metodo.getMethod().getParameterCount()]);
        AuthorizationResult resultado = autorizacao.authorize(
                () -> SecurityContextHolder.getContext().getAuthentication(), invocacao);
        if (resultado != null && !resultado.isGranted()) {
            throw new AccessDeniedException("Acesso negado");
        }
        return true;
    }
}
