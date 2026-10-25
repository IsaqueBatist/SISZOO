package com.siszoo.seed;

import static io.restassured.RestAssured.given;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.UUID;

import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;
import com.siszoo.comum.RelogioTesteConfig;

import io.restassured.path.json.JsonPath;

// Seed de dados ficticios ponta a ponta: perfil `seed` + habilitado, num banco
// so dele (contexto proprio). O seed roda na subida (ApplicationReadyEvent),
// depois do admin bootstrap do DataSeeder, com o relogio fixo dos testes.
// Os metodos rodam em ordem: as contagens exatas vem antes de qualquer
// cenario que crie dados fora do seed.
@ActiveProfiles("seed")
@Import(RelogioTesteConfig.class)
@TestPropertySource(properties = {
        "siszoo.seed.habilitado=true",
        "siszoo.admin.email=admin.sistema@itu.sp.gov.br",
        "siszoo.admin.password=Ccz-Dev-Itu-2026"
})
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class SeedDevIT extends AbstractIntegrationTest {

    @Autowired
    private SeedDev seedDev;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ApiTesteFixture fixture;

    @Test
    @Order(1)
    void naSubidaCriaExatamenteOPlano() {
        assertThat(seedDev.ultimoResumo()).isNotNull();
        assertThat(seedDev.ultimoResumo().criados()).isPositive();

        int procedimentos = AnimaisSeed.PLANO.stream().mapToInt(a -> AnimaisSeed.procedimentosDo(a).size()).sum();
        assertThat(contar("SELECT count(*) FROM usuario WHERE email LIKE '%.seed@itu.sp.gov.br'"))
                .isEqualTo(UsuariosSeed.PLANO.size());
        assertThat(contar("SELECT count(*) FROM categoria_farmacologica")).isEqualTo(CatalogoClinicoSeed.CATEGORIAS.size());
        assertThat(contar("SELECT count(*) FROM medicamento")).isEqualTo(CatalogoClinicoSeed.MEDICAMENTOS.size());
        assertThat(contar("SELECT count(*) FROM baia")).isEqualTo(BaiasSeed.PLANO.size());
        assertThat(contar("SELECT count(*) FROM animal")).isEqualTo(AnimaisSeed.PLANO.size());
        // +1 em cada: a retificacao e um registro novo.
        assertThat(contar("SELECT count(*) FROM vacinacao")).isEqualTo(AnimaisSeed.VACINAS.size() + 1);
        assertThat(contar("SELECT count(*) FROM procedimento")).isEqualTo(procedimentos + 1);
        assertThat(contar("SELECT count(*) FROM prescricao")).isEqualTo(AnimaisSeed.PRESCRICOES.size() + 1);
        assertThat(contar("SELECT count(*) FROM exame")).isEqualTo(AnimaisSeed.EXAMES.size() + 1);
        assertThat(contar("SELECT count(*) FROM anexo_animal")).isEqualTo(AnimaisSeed.ANEXOS.size());
        assertThat(contar("SELECT count(*) FROM ocorrencia")).isEqualTo(OcorrenciasSeed.PLANO.size());
        assertThat(contar("SELECT count(*) FROM processo_sanitario")).isEqualTo(ProcessosSeed.PLANO.size());
        assertThat(contar("SELECT count(*) FROM relatorio_gerado")).isEqualTo(RelatoriosSeed.PLANO.size());
        // Auditoria verdadeira, gravada pelos services (nada de evento fabricado).
        assertThat(contar("SELECT count(*) FROM auditoria_evento WHERE entidade = 'animal' AND acao = 'CRIACAO'"))
                .isEqualTo(AnimaisSeed.PLANO.size());
    }

    @Test
    @Order(2)
    void reexecutarNaoCriaNadaNemAlteraOBanco() {
        Map<String, Object> antes = retratoDoBanco();

        ResumoSeed segunda = seedDev.executar();
        ResumoSeed terceira = seedDev.executar();

        assertThat(segunda.criados()).isZero();
        assertThat(terceira.criados()).isZero();
        assertThat(segunda.existentes()).isPositive();
        assertThat(retratoDoBanco()).isEqualTo(antes);
    }

    @Test
    @Order(3)
    void naoDeixaAutenticacaoNoContextoDeSeguranca() {
        seedDev.executar();

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    @Order(4)
    void invariantesDeNegocio() {
        // Ficha completa calculada pelo FichaCompletaService (RN-AN04), inclusive
        // quando o microchip entra depois da vacina (animal 018).
        assertThat(fichaCompleta(12)).isTrue();
        assertThat(fichaCompleta(15)).isFalse();
        assertThat(fichaCompleta(18)).isTrue();
        assertThat(fichaCompleta(20)).isFalse();

        // Senha trocada pela AuthService (sem primeiro acesso), exceto o usuario
        // de primeiro acesso; o agente inativo continua inativo.
        assertThat(contar("SELECT count(*) FROM usuario WHERE email LIKE '%.seed@itu.sp.gov.br'"
                + " AND senha_alterada_em IS NULL")).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT senha_alterada_em IS NULL FROM usuario WHERE email = ?",
                Boolean.class, "helena.duarte" + UsuariosSeed.SUFIXO_EMAIL)).isTrue();
        assertThat(jdbcTemplate.queryForObject("SELECT ativo FROM usuario WHERE email = ?", Boolean.class,
                "sergio.lacerda" + UsuariosSeed.SUFIXO_EMAIL)).isFalse();

        // SD-4: nenhum processo notificavel tem e-mail do responsavel, e nenhuma
        // notificacao foi registrada como enviada.
        for (ProcessosSeed.Processo processo : ProcessosSeed.PLANO) {
            if (processo.notificavel()) {
                assertThat(jdbcTemplate.queryForObject("SELECT r.email FROM seed_controle s"
                        + " JOIN responsavel_processo r ON r.processo_id = s.entidade_id WHERE s.chave = ?",
                        String.class, processo.chave())).as(processo.chave()).isNull();
            }
        }
        assertThat(contar("SELECT count(*) FROM processo_sanitario WHERE data_notificacao_municipe IS NOT NULL"))
                .isZero();

        // Os 4 status de processo, positivo nunca retificado, ocorrencia vinculada
        // encerrada so depois do processo concluido (D12).
        assertThat(jdbcTemplate.queryForList("SELECT DISTINCT status_processo FROM processo_sanitario", String.class))
                .containsExactlyInAnyOrder("ABERTO", "AGUARDANDO_RESULTADO", "COM_RESULTADO", "CONCLUIDO");
        assertThat(contar("SELECT count(*) FROM resultado_processo r JOIN resultado_laboratorial l"
                + " ON l.id = r.resultado_laboratorial_id WHERE r.retifica_id IS NOT NULL AND EXISTS ("
                + " SELECT 1 FROM resultado_processo o JOIN resultado_laboratorial ol ON ol.id = o.resultado_laboratorial_id"
                + " WHERE o.id = r.retifica_id AND ol.codigo = 'positivo')")).isZero();
        assertThat(contar("SELECT count(*) FROM resultado_processo WHERE retifica_id IS NOT NULL")).isEqualTo(2);
        assertThat(jdbcTemplate.queryForList("SELECT o.status_ocorrencia FROM ocorrencia o"
                + " JOIN processo_sanitario p ON p.ocorrencia_id = o.id WHERE p.status_processo <> 'CONCLUIDO'",
                String.class)).containsOnly("EM_ATENDIMENTO");
        assertThat(contar("SELECT count(*) FROM ocorrencia WHERE status_ocorrencia = 'ABERTA'")).isEqualTo(8);
        assertThat(contar("SELECT count(*) FROM ocorrencia WHERE status_ocorrencia = 'ENCERRADA'")).isEqualTo(11);
    }

    @Test
    @Order(5)
    void cenarioPelaApiReal() {
        // Login com a senha documentada prova o hash do PasswordEncoder real.
        String tokenAdmin = fixture.login("marta.siqueira" + UsuariosSeed.SUFIXO_EMAIL, UsuariosSeed.SENHA_FICTICIA);
        String tokenVet = fixture.login("renato.albuquerque" + UsuariosSeed.SUFIXO_EMAIL, UsuariosSeed.SENHA_FICTICIA);

        JsonPath kpis = get(tokenAdmin, "/api/dashboard/kpis");
        List<Map<String, Object>> alertas = kpis.getList("alertas");
        assertThat(alertas).hasSize(7).allSatisfy(alerta ->
                assertThat(((Number) alerta.get("total")).longValue()).as((String) alerta.get("tipo")).isPositive());
        assertThat(kpis.getLong("adocoes.adotados")).isEqualTo(6);
        assertThat(kpis.getLong("adocoes.disponiveis")).isPositive();
        assertThat(kpis.getLong("ocorrencias.registradasHoje")).isEqualTo(2);

        // Mais de uma pagina (20) nas tres listagens principais.
        assertThat(get(tokenAdmin, "/api/animais?tamanho=20").getInt("totalPaginas")).isGreaterThanOrEqualTo(2);
        assertThat(get(tokenAdmin, "/api/ocorrencias?tamanho=20").getInt("totalPaginas")).isGreaterThanOrEqualTo(2);
        assertThat(get(tokenAdmin, "/api/processos?tamanho=20").getInt("totalPaginas")).isGreaterThanOrEqualTo(2);

        // RBAC preservado: o Veterinario nao acessa ocorrencias (V11).
        given().header("Authorization", "Bearer " + tokenVet).when().get("/api/ocorrencias").then().statusCode(403);

        // Sigilo preservado: quem le ocorrencias sem denunciante_sigiloso nao ve o denunciante.
        UUID sigilosa = idDaChave(OcorrenciasSeed.chaveOcorrencia(3));
        String tokenLeitor = fixture.tokenLeitorOcorrencias("leitor.seed.it@itu.sp.gov.br", "SeedIt");
        JsonPath detalhe = get(tokenLeitor, "/api/ocorrencias/" + sigilosa);
        assertThat(detalhe.getBoolean("sigilosa")).isTrue();
        assertThat(detalhe.getBoolean("podeVerDenunciante")).isFalse();
        assertThat((Object) detalhe.get("denunciante.nome")).isNull();
        JsonPath completo = get(tokenAdmin, "/api/ocorrencias/" + sigilosa);
        assertThat(completo.getString("denunciante.nome")).isEqualTo("Rosa Antunes");
    }

    private JsonPath get(String token, String rota) {
        return given().header("Authorization", "Bearer " + token).when().get(rota)
                .then().statusCode(200).extract().jsonPath();
    }

    private long contar(String sql) {
        return jdbcTemplate.queryForObject(sql, Long.class);
    }

    private UUID idDaChave(String chave) {
        return jdbcTemplate.queryForObject("SELECT entidade_id FROM seed_controle WHERE chave = ?", UUID.class, chave);
    }

    private boolean fichaCompleta(int animal) {
        return jdbcTemplate.queryForObject("SELECT ficha_completa FROM animal WHERE id = ?", Boolean.class,
                idDaChave(AnimaisSeed.chaveAnimal(animal)));
    }

    // Contagem de todas as tabelas do schema, da auditoria por entidade/acao e
    // da sequencia de protocolos: qualquer gravacao a mais aparece aqui.
    private Map<String, Object> retratoDoBanco() {
        Map<String, Object> retrato = new TreeMap<>();
        for (String tabela : jdbcTemplate.queryForList("SELECT table_name FROM information_schema.tables"
                + " WHERE table_schema = 'public' AND table_type = 'BASE TABLE'", String.class)) {
            retrato.put(tabela, contar("SELECT count(*) FROM \"" + tabela + "\""));
        }
        retrato.put("auditoria_por_entidade_acao", jdbcTemplate.queryForList(
                "SELECT entidade, acao, count(*) AS total FROM auditoria_evento GROUP BY 1, 2 ORDER BY 1, 2"));
        retrato.put("protocolo_sequencia", jdbcTemplate.queryForList("SELECT * FROM protocolo_sequencia ORDER BY 1, 2"));
        return retrato;
    }
}
