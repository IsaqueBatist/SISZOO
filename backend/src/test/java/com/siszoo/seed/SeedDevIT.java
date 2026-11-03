package com.siszoo.seed;

import static io.restassured.RestAssured.given;
import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;
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

    @Autowired
    private Clock clock;

    private static long ocorrenciasCom(OcorrenciasSeed.Destino... destinos) {
        Set<OcorrenciasSeed.Destino> alvos = Set.of(destinos);
        return OcorrenciasSeed.PLANO.stream().filter(o -> alvos.contains(o.destino())).count();
    }

    /** O KPI conta só o dia corrente e exclui as encerradas como registro indevido. */
    private long ocorrenciasDeHoje() {
        DatasSeed datas = new DatasSeed(clock);
        return OcorrenciasSeed.PLANO.stream()
                .filter(o -> !"registro_indevido".equals(o.providencia()))
                .filter(o -> o.data().apply(datas).equals(datas.hoje()))
                .count();
    }

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
        assertThat(contar("SELECT count(*) FROM animal WHERE foto_url LIKE 'data:image/jpeg;base64,%'"
                + " AND foto_miniatura LIKE 'data:image/jpeg;base64,%'")).isEqualTo(AnimaisSeed.PLANO.size());
        assertThat(contar("SELECT count(*) FROM vacinacao")).isEqualTo(AnimaisSeed.VACINAS.size() + 1);
        assertThat(contar("SELECT count(*) FROM procedimento")).isEqualTo(procedimentos + 1);
        assertThat(contar("SELECT count(*) FROM prescricao")).isEqualTo(AnimaisSeed.PRESCRICOES.size() + 1);
        assertThat(contar("SELECT count(*) FROM exame")).isEqualTo(AnimaisSeed.EXAMES.size() + 1);
        assertThat(contar("SELECT count(*) FROM anexo_animal")).isEqualTo(AnimaisSeed.ANEXOS.size());
        assertThat(contar("SELECT count(*) FROM ocorrencia")).isEqualTo(OcorrenciasSeed.PLANO.size());
        assertThat(contar("SELECT count(*) FROM processo_sanitario")).isEqualTo(ProcessosSeed.PLANO.size());
        assertThat(contar("SELECT count(*) FROM relatorio_gerado")).isEqualTo(RelatoriosSeed.PLANO.size());
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
        assertThat(fichaCompleta(12)).isTrue();
        assertThat(fichaCompleta(15)).isFalse();
        assertThat(fichaCompleta(18)).isTrue();
        assertThat(fichaCompleta(20)).isFalse();

        assertThat(contar("SELECT count(*) FROM usuario WHERE email LIKE '%.seed@itu.sp.gov.br'"
                + " AND senha_alterada_em IS NULL")).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject("SELECT senha_alterada_em IS NULL FROM usuario WHERE email = ?",
                Boolean.class, "helena.duarte" + UsuariosSeed.SUFIXO_EMAIL)).isTrue();
        assertThat(jdbcTemplate.queryForObject("SELECT ativo FROM usuario WHERE email = ?", Boolean.class,
                "sergio.lacerda" + UsuariosSeed.SUFIXO_EMAIL)).isFalse();

        for (ProcessosSeed.Processo processo : ProcessosSeed.PLANO) {
            if (processo.notificavel()) {
                assertThat(jdbcTemplate.queryForObject("SELECT r.email FROM seed_controle s"
                        + " JOIN responsavel_processo r ON r.processo_id = s.entidade_id WHERE s.chave = ?",
                        String.class, processo.chave())).as(processo.chave()).isNull();
            }
        }
        assertThat(contar("SELECT count(*) FROM processo_sanitario WHERE data_notificacao_municipe IS NOT NULL"))
                .isZero();

        assertThat(jdbcTemplate.queryForList("SELECT DISTINCT status_processo FROM processo_sanitario", String.class))
                .containsExactlyInAnyOrder("ABERTO", "AGUARDANDO_RESULTADO", "COM_RESULTADO", "CONCLUIDO");
        assertThat(contar("SELECT count(*) FROM resultado_processo r JOIN resultado_laboratorial l"
                + " ON l.id = r.resultado_laboratorial_id WHERE r.retifica_id IS NOT NULL AND EXISTS ("
                + " SELECT 1 FROM resultado_processo o JOIN resultado_laboratorial ol ON ol.id = o.resultado_laboratorial_id"
                + " WHERE o.id = r.retifica_id AND ol.codigo = 'positivo')")).isZero();
        assertThat(contar("SELECT count(*) FROM resultado_processo WHERE retifica_id IS NOT NULL"))
                .isEqualTo(ProcessosSeed.PLANO.stream().filter(p -> p.retificacao() != null).count());
        assertThat(jdbcTemplate.queryForList("SELECT o.status_ocorrencia FROM ocorrencia o"
                + " JOIN processo_sanitario p ON p.ocorrencia_id = o.id WHERE p.status_processo <> 'CONCLUIDO'",
                String.class)).containsOnly("EM_ATENDIMENTO");
        assertThat(contar("SELECT count(*) FROM ocorrencia WHERE status_ocorrencia = 'ABERTA'"))
                .isEqualTo(ocorrenciasCom(OcorrenciasSeed.Destino.ABERTA));
        // VINCULADA é encerrada pelo ProcessosSeed quando o processo conclui.
        assertThat(contar("SELECT count(*) FROM ocorrencia WHERE status_ocorrencia = 'ENCERRADA'"))
                .isEqualTo(ocorrenciasCom(OcorrenciasSeed.Destino.ENCERRADA,
                        OcorrenciasSeed.Destino.ENCERRADA_DIRETO, OcorrenciasSeed.Destino.VINCULADA));

        // Vínculo ocorrência↔animal (V35): 1:1 nos dois sentidos.
        long comAnimal = OcorrenciasSeed.PLANO.stream().filter(o -> o.animal() != null).count();
        assertThat(contar("SELECT count(*) FROM ocorrencia WHERE animal_id IS NOT NULL")).isEqualTo(comAnimal)
                .isPositive();
        assertThat(contar("SELECT count(DISTINCT animal_id) FROM ocorrencia WHERE animal_id IS NOT NULL"))
                .isEqualTo(comAnimal);

        // Três estados de esterilização (V31) e de contato humano na amostra.
        assertThat(contar("SELECT count(*) FROM animal WHERE esterilizado IS NULL")).isPositive();
        assertThat(contar("SELECT count(*) FROM animal WHERE esterilizado IS FALSE")).isPositive();
        assertThat(contar("SELECT count(*) FROM animal WHERE esterilizado IS TRUE")).isPositive();
        assertThat(contar("SELECT count(*) FROM animal_amostrado WHERE contato_humano IS NULL")).isPositive();

        // Todas as espécies do catálogo têm animal no canil.
        assertThat(jdbcTemplate.queryForList(
                "SELECT DISTINCT e.codigo FROM animal a JOIN especie e ON e.id = a.especie_id", String.class))
                .containsExactlyInAnyOrder("canino", "felino", "quiroptero", "pnh");

        // Condições de saúde (V33) e data de nascimento aproximada deixaram de ser colunas mortas.
        assertThat(contar("SELECT count(*) FROM animal_condicao_saude")).isPositive();
        assertThat(contar("SELECT count(*) FROM animal WHERE condicoes_outras IS NOT NULL")).isPositive();
        assertThat(contar("SELECT count(*) FROM animal WHERE data_nascimento_aprox IS NOT NULL")).isPositive();

        // Os quatro tipos de destino de transferência.
        assertThat(jdbcTemplate.queryForList(
                "SELECT DISTINCT tipo_destino_transferencia FROM animal WHERE data_saida IS NOT NULL", String.class))
                .containsExactlyInAnyOrder("ENTIDADE_PROTECAO", "ORGAO_PUBLICO", "OUTRO_CCZ", "OUTRO");
    }

    @Test
    @Order(5)
    void alertasRespeitamOsLimitesDeDataDoPlano() {
        String token = fixture.login("marta.siqueira" + UsuariosSeed.SUFIXO_EMAIL, UsuariosSeed.SENHA_FICTICIA);

        // 72 h de esterilização: entra quem tem `esterilizado = false` e entrada anterior ao limite.
        List<String> nomes = get(token, "/api/alertas/esterilizacao").getList("animalNome");
        assertThat(nomes).contains("Nuvem", "Teimoso")
                .doesNotContain("Pretinha", "Caramelo")   // dentro das 72 h
                .doesNotContain("Pinta");                 // esterilizado = NULL não entra na query

        // Janela de 7 dias do alerta vacinal, pela validade derivada (aplicação + intervalo).
        JsonPath vacinas = get(token, "/api/alertas/vacinas");
        assertThat(vacinas.getList("animalNome", String.class))
                .contains("Lola", "Branca", "Canela")     // validade em 0, +7 e -1 dia
                .doesNotContain("Jeca");                  // validade em +8 dias fica fora
        assertThat(vacinas.getList("vacinas.flatten().severidade", String.class))
                .contains("A_VENCER", "VENCIDA");
    }

    @Test
    @Order(6)
    void contatoNaoInformadoApareceNoRelatorioAnual() {
        String token = fixture.login("marta.siqueira" + UsuariosSeed.SUFIXO_EMAIL, UsuariosSeed.SENHA_FICTICIA);
        JsonPath preview = get(token, "/api/relatorios/preview?tipo=anual_processos&ano="
                + LocalDate.now(clock).getYear());
        assertThat(preview.getLong("kpis.contatoNaoInformado")).isPositive();
        assertThat(preview.getLong("kpis.comContatoHumano")).isPositive();
    }

    @Test
    @Order(7)
    void cenarioPelaApiReal() {
        String tokenAdmin = fixture.login("marta.siqueira" + UsuariosSeed.SUFIXO_EMAIL, UsuariosSeed.SENHA_FICTICIA);
        String tokenVet = fixture.login("renato.albuquerque" + UsuariosSeed.SUFIXO_EMAIL, UsuariosSeed.SENHA_FICTICIA);

        JsonPath kpis = get(tokenAdmin, "/api/dashboard/kpis");
        List<Map<String, Object>> alertas = kpis.getList("alertas");
        assertThat(alertas).hasSize(8).allSatisfy(alerta ->
                assertThat(((Number) alerta.get("total")).longValue()).as((String) alerta.get("tipo")).isPositive());
        assertThat(kpis.getLong("adocoes.adotados"))
                .isEqualTo(AnimaisSeed.PLANO.stream().filter(a -> "adotado".equals(a.destino)).count());
        assertThat(kpis.getLong("adocoes.disponiveis")).isPositive();
        assertThat(kpis.getLong("ocorrencias.registradasHoje")).isEqualTo(ocorrenciasDeHoje());

        assertThat(get(tokenAdmin, "/api/animais?tamanho=20").getInt("totalPaginas")).isGreaterThanOrEqualTo(2);
        assertThat(get(tokenAdmin, "/api/ocorrencias?tamanho=20").getInt("totalPaginas")).isGreaterThanOrEqualTo(2);
        assertThat(get(tokenAdmin, "/api/processos?tamanho=20").getInt("totalPaginas")).isGreaterThanOrEqualTo(2);

        given().header("Authorization", "Bearer " + tokenVet).when().get("/api/ocorrencias").then().statusCode(403);

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
