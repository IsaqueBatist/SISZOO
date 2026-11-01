package com.siszoo.usuarios.service;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

import com.siszoo.usuarios.exception.LimiteTentativasException;

class LimitadorLoginTest {

    private static final String EMAIL = "maria.silva@itu.sp.gov.br";

    private final LimitadorLogin limitador = new LimitadorLogin(2, 3, 15);

    @Test
    void bloqueiaOEmailDepoisDasFalhasDaJanelaEIgnoraMaiusculasEEspacos() {
        limitador.registrarFalha(EMAIL, "10.0.0.1");
        limitador.registrarFalha(" Maria.Silva@itu.sp.gov.br ", "10.0.0.2");

        assertThrows(LimiteTentativasException.class, () -> limitador.exigirPermitido(EMAIL, "10.0.0.3"));
        assertDoesNotThrow(() -> limitador.exigirPermitido("outra.pessoa@itu.sp.gov.br", "10.0.0.3"));
    }

    @Test
    void loginCorretoZeraSoOContadorDoEmail() {
        limitador.registrarFalha(EMAIL, "10.0.0.1");
        limitador.registrarFalha(EMAIL, "10.0.0.1");
        limitador.registrarSucesso(EMAIL);

        assertDoesNotThrow(() -> limitador.exigirPermitido(EMAIL, "10.0.0.1"));

        limitador.registrarFalha("a.a@itu.sp.gov.br", "10.0.0.1");
        assertThrows(LimiteTentativasException.class, () -> limitador.exigirPermitido("b.b@itu.sp.gov.br", "10.0.0.1"));
    }

    @Test
    void limitePorIpValeMesmoComEmailsDiferentes() {
        limitador.registrarFalha("a.a@itu.sp.gov.br", "10.0.0.9");
        limitador.registrarFalha("b.b@itu.sp.gov.br", "10.0.0.9");
        limitador.registrarFalha("c.c@itu.sp.gov.br", "10.0.0.9");

        assertThrows(LimiteTentativasException.class, () -> limitador.exigirPermitido("d.d@itu.sp.gov.br", "10.0.0.9"));
        assertDoesNotThrow(() -> limitador.exigirPermitido("d.d@itu.sp.gov.br", "10.0.0.10"));
    }

    @Test
    void semFalhasNadaBloqueia() {
        assertDoesNotThrow(() -> limitador.exigirPermitido(EMAIL, null));
    }
}
