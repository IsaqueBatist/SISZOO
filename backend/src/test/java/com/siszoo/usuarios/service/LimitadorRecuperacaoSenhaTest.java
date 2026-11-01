package com.siszoo.usuarios.service;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

import com.siszoo.usuarios.exception.LimiteTentativasException;

class LimitadorRecuperacaoSenhaTest {

    private final LimitadorRecuperacaoSenha limitador = new LimitadorRecuperacaoSenha(2, 3, 60, 2, 15);

    @Test
    void limitePorEmailIgnoraMaiusculasEEspacos() {
        limitador.registrarSolicitacao("Maria.Silva@itu.sp.gov.br", "10.0.0.1");
        limitador.registrarSolicitacao(" maria.silva@itu.sp.gov.br ", "10.0.0.2");

        assertThrows(LimiteTentativasException.class,
                () -> limitador.registrarSolicitacao("maria.silva@itu.sp.gov.br", "10.0.0.3"));
        assertDoesNotThrow(() -> limitador.registrarSolicitacao("outra.pessoa@itu.sp.gov.br", "10.0.0.4"));
    }

    @Test
    void limitePorIpValeMesmoComEmailsDiferentes() {
        limitador.registrarSolicitacao("a.a@itu.sp.gov.br", "10.0.0.9");
        limitador.registrarSolicitacao("b.b@itu.sp.gov.br", "10.0.0.9");
        limitador.registrarSolicitacao("c.c@itu.sp.gov.br", "10.0.0.9");

        assertThrows(LimiteTentativasException.class,
                () -> limitador.registrarSolicitacao("d.d@itu.sp.gov.br", "10.0.0.9"));
        assertDoesNotThrow(() -> limitador.registrarSolicitacao("d.d@itu.sp.gov.br", "10.0.0.10"));
    }

    @Test
    void consumoPorIpTemContadorProprio() {
        limitador.registrarSolicitacao("a.a@itu.sp.gov.br", "10.0.0.5");
        limitador.registrarConsumo("10.0.0.5");
        limitador.registrarConsumo("10.0.0.5");

        assertThrows(LimiteTentativasException.class, () -> limitador.registrarConsumo("10.0.0.5"));
        assertDoesNotThrow(() -> limitador.registrarConsumo("10.0.0.6"));
    }

    @Test
    void ipDesconhecidoCompartilhaUmaChave() {
        limitador.registrarConsumo(null);
        limitador.registrarConsumo(null);

        assertThrows(LimiteTentativasException.class, () -> limitador.registrarConsumo(null));
    }
}
