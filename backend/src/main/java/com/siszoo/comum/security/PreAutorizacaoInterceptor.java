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

@Component
public class PreAutorizacaoInterceptor implements HandlerInterceptor {

    private final PreAuthorizeAuthorizationManager autorizacao = new PreAuthorizeAuthorizationManager();

    public PreAutorizacaoInterceptor(ApplicationContext applicationContext) {
        autorizacao.setApplicationContext(applicationContext);
    }

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
            throw new AccessDeniedException("Você não tem permissão para realizar esta ação.");
        }
        return true;
    }
}
