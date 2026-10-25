package com.siszoo.seed;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.Map;
import java.util.TreeMap;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;

// Guarda de banco (SD-1): num banco sem seed_controle que ja tem dados de
// dominio criados fora do seed, o seed recusa ANTES de gravar qualquer coisa —
// nem a tabela de controle e criada. Contexto proprio (banco proprio) com o
// seed ligado mas sem rodar na subida.
@ActiveProfiles("seed")
@TestPropertySource(properties = {
        "siszoo.seed.habilitado=true",
        "siszoo.seed.executar-na-subida=false",
        "siszoo.admin.email=admin.sistema@itu.sp.gov.br",
        "siszoo.admin.password=Ccz-Dev-Itu-2026"
})
class SeedDevBancoComDadosIT extends AbstractIntegrationTest {

    @Autowired
    private SeedDev seedDev;

    @Autowired
    private ApiTesteFixture fixture;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void recusaBancoComDadosDeForaDoSeedSemGravarNada() {
        String token = fixture.tokenAdmin("admin.alheio@itu.sp.gov.br", "Alheio");
        fixture.criarAnimal(token);
        Map<String, Long> antes = contagens();

        assertThatThrownBy(seedDev::executar)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("banco ja contem dados que nao vieram do seed");

        assertThat(contagens()).isEqualTo(antes);
        assertThat(jdbcTemplate.queryForObject("SELECT to_regclass('public.seed_controle') IS NULL", Boolean.class))
                .isTrue();
    }

    private Map<String, Long> contagens() {
        Map<String, Long> contagens = new TreeMap<>();
        for (String tabela : jdbcTemplate.queryForList("SELECT table_name FROM information_schema.tables"
                + " WHERE table_schema = 'public' AND table_type = 'BASE TABLE'", String.class)) {
            contagens.put(tabela, jdbcTemplate.queryForObject("SELECT count(*) FROM \"" + tabela + "\"", Long.class));
        }
        return contagens;
    }
}
