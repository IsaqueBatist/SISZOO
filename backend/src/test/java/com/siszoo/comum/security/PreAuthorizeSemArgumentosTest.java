package com.siszoo.comum.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.core.type.filter.AnnotationTypeFilter;
import org.springframework.stereotype.Controller;
import org.springframework.util.ClassUtils;

// O PreAutorizacaoInterceptor avalia o @PreAuthorize antes de ler os
// argumentos do metodo. Uma expressao com argumentos (#param) seria avaliada
// com tudo nulo; o interceptor a recusa em tempo de execucao, e este teste
// quebra antes disso, no build, se algum controller passar a usar "#".
class PreAuthorizeSemArgumentosTest {

    private record Uso(String metodo, String expressao) {
    }

    private static List<Uso> preAuthorizeDosControllers(String pacote) throws ClassNotFoundException {
        ClassPathScanningCandidateComponentProvider scanner = new ClassPathScanningCandidateComponentProvider(false);
        scanner.addIncludeFilter(new AnnotationTypeFilter(Controller.class));
        List<Uso> usos = new ArrayList<>();
        for (BeanDefinition candidato : scanner.findCandidateComponents(pacote)) {
            Class<?> classe = ClassUtils.forName(candidato.getBeanClassName(), PreAuthorizeSemArgumentosTest.class.getClassLoader());
            for (Method metodo : classe.getDeclaredMethods()) {
                String expressao = PreAutorizacaoInterceptor.expressaoPreAuthorize(metodo, classe);
                if (expressao != null) {
                    usos.add(new Uso(classe.getSimpleName() + "#" + metodo.getName(), expressao));
                }
            }
        }
        return usos;
    }

    @Test
    @DisplayName("nenhum @PreAuthorize dos controllers usa argumentos do metodo (#)")
    void nenhumControllerUsaArgumentoNoPreAuthorize() throws ClassNotFoundException {
        List<Uso> usos = preAuthorizeDosControllers("com.siszoo");

        // A varredura tem de achar os endpoints protegidos, senao o teste
        // passaria por vazio.
        assertThat(usos).hasSizeGreaterThanOrEqualTo(49);
        assertThat(usos).filteredOn(uso -> PreAutorizacaoInterceptor.usaArgumentosDoMetodo(uso.expressao())).isEmpty();
    }

    @Test
    @DisplayName("contraprova: a varredura acha o @PreAuthorize com # do controller-fixture")
    void varreduraAchaUsoDeArgumento() throws ClassNotFoundException {
        List<Uso> usos = preAuthorizeDosControllers("fixture.preautorizacao");

        assertThat(usos).filteredOn(uso -> PreAutorizacaoInterceptor.usaArgumentosDoMetodo(uso.expressao()))
                .extracting(Uso::metodo)
                .containsExactly("ControllerComArgumentoNoPreAuthorize#comArgumento");
    }
}
