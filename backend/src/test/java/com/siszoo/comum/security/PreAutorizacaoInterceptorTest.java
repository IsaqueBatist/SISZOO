package com.siszoo.comum.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.context.support.StaticApplicationContext;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.method.HandlerMethod;

import fixture.preautorizacao.ControllerComArgumentoNoPreAuthorize;

// O caso fora do suporte do interceptor tem de falhar alto, nunca ser avaliado
// em silencio com argumentos nulos. O caminho normal (hasAuthority) esta
// coberto por AutorizacaoAntesDaValidacaoIT, com a seguranca real.
class PreAutorizacaoInterceptorTest {

    private final PreAutorizacaoInterceptor interceptor = new PreAutorizacaoInterceptor(new StaticApplicationContext());
    private final ControllerComArgumentoNoPreAuthorize controller = new ControllerComArgumentoNoPreAuthorize();

    @Test
    void preAuthorizeComArgumentoERecusadoDeFormaExplicita() throws NoSuchMethodException {
        HandlerMethod handler = new HandlerMethod(controller, "comArgumento", String.class);

        assertThatThrownBy(() -> interceptor.preHandle(new MockHttpServletRequest(), new MockHttpServletResponse(), handler))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("#id == authentication.name");
    }

    @Test
    void metodoSemPreAuthorizeSegue() throws Exception {
        HandlerMethod handler = new HandlerMethod(controller, "semPreAuthorize");

        assertThat(interceptor.preHandle(new MockHttpServletRequest(), new MockHttpServletResponse(), handler)).isTrue();
    }
}
