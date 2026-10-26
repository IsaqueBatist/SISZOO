package com.siszoo.seed;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.jdbc.core.JdbcTemplate;

import com.siszoo.comum.AbstractIntegrationTest;

// Sem o perfil `seed` (contexto base dos *IT, o mesmo de producao quanto a
// isso), nenhum bean do seed existe e seed_controle nunca e criada.
class SeedDevInativoIT extends AbstractIntegrationTest {

    @Autowired
    private ApplicationContext contexto;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void semPerfilSeedNadaDoSeedExiste() {
        assertThat(contexto.getBeansOfType(SeedDev.class)).isEmpty();
        assertThat(contexto.getBeansOfType(SeedDevGuarda.class)).isEmpty();
        assertThat(jdbcTemplate.queryForObject("SELECT to_regclass('public.seed_controle') IS NULL", Boolean.class))
                .isTrue();
    }
}
