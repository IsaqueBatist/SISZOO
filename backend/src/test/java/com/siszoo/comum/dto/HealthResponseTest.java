package com.siszoo.comum.dto;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

// TODO: substituir por teste de regra de negócio real quando T08+ existir
class HealthResponseTest {

    @Test
    void statusAcessivelPeloAccessor() {
        HealthResponse resposta = new HealthResponse("UP");

        assertEquals("UP", resposta.status());
    }
}
