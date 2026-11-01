package com.siszoo.comum;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasItems;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.nullValue;

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.List;
import java.util.UUID;

import javax.sql.DataSource;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationVersion;
import org.flywaydb.core.api.output.MigrateResult;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

// V29 a V33 (decisoes funcionais de 31/10/2026) e V34 (recuperacao de senha)
// sobre um banco parado na V28 com dados, num schema proprio do PostgreSQL de
// teste: nada existente pode mudar.
class MigracaoDecisoesFuncionaisIT extends AbstractIntegrationTest {

    private static final String SCHEMA = "migracao_decisoes_funcionais";
    private static final String S = SCHEMA + ".";
    private static final String ADMINISTRADOR = "00000000-0000-4000-8000-000000000001";
    private static final String VETERINARIO = "00000000-0000-4000-8000-000000000002";
    private static final String AGENTE = "00000000-0000-4000-8000-000000000003";

    @Autowired
    private DataSource dataSource;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @AfterEach
    void removerSchemaDoTeste() {
        jdbcTemplate.execute("DROP SCHEMA IF EXISTS " + SCHEMA + " CASCADE");
    }

    private record Dados(UUID castrado, UUID naoCastrado, UUID amostraSemContato, UUID amostraComContato) {
    }

    @Test
    @DisplayName("V28 -> V34 com dados: respostas antigas preservadas, sem condicao inventada e auditoria intacta")
    void atualizacaoComDados() throws Exception {
        assertThat(migrarAte("28").targetSchemaVersion, equalTo("28"));
        Dados dados = inserirDadosNaV28();

        MigrateResult resultado = migrarAte("34");

        assertThat(resultado.success, equalTo(true));
        assertThat(resultado.migrationsExecuted, equalTo(6));

        // V31: false continua false, e true continua true.
        assertThat(esterilizado(dados.castrado()), equalTo(true));
        assertThat(esterilizado(dados.naoCastrado()), equalTo(false));
        assertThat(contatoHumano(dados.amostraSemContato()), equalTo(false));
        assertThat(contatoHumano(dados.amostraComContato()), equalTo(true));

        // V33: aditiva. observacoes intacto, e nenhuma condicao marcada sozinha.
        assertThat(jdbcTemplate.queryForObject("SELECT observacoes FROM " + S + "animal WHERE id = ?", String.class,
                dados.castrado()), equalTo("Texto antigo"));
        assertThat(jdbcTemplate.queryForObject("SELECT count(*) FROM " + S + "animal_condicao_saude", Integer.class),
                equalTo(0));
        assertThat(jdbcTemplate.queryForObject("SELECT condicoes_outras FROM " + S + "animal WHERE id = ?", String.class,
                dados.castrado()), nullValue());
        assertThat(jdbcTemplate.queryForList("SELECT codigo FROM " + S + "condicao_saude", String.class),
                hasItems("epilepsia", "cardiopatia", "diabetes", "agressividade", "cegueira", "surdez", "outras"));

        // V29: a trilha antiga continua la, e a acao nova passa no CHECK.
        assertThat(jdbcTemplate.queryForObject("SELECT count(*) FROM " + S + "auditoria_evento", Integer.class),
                equalTo(1));
        assertThat(transacao("INSERT INTO " + S + "auditoria_evento (acao, entidade)"
                + " VALUES ('SESSAO_REVOGADA', 'sessao_usuario')"), nullValue());
    }

    @Test
    @DisplayName("V31: nao informado e aceito, e o CHECK continua amarrando contato, nivel e agressao")
    void checkDoContato() throws Exception {
        migrarAte("34");
        UUID usuario = inserirUsuario();
        UUID processo = UUID.randomUUID();
        assertThat(transacao(processo(processo, usuario), responsavel(processo)
                + "; " + amostra(processo, "NULL", "NULL", "NULL")), nullValue());

        assertViolacao(transacao(amostra(processo, "NULL", "'DIRETA'", "true")), "ck_animal_amostrado_contato");
        assertViolacao(transacao(amostra(processo, "false", "'DIRETA'", "false")), "ck_animal_amostrado_contato");
        assertViolacao(transacao(amostra(processo, "true", "NULL", "NULL")), "ck_animal_amostrado_contato");
        assertThat(transacao(amostra(processo, "true", "'DIRETA'", "false")), nullValue());
    }

    @Test
    @DisplayName("V31: INSERT que omite esterilizado fica nao informado, sem o DEFAULT false antigo")
    void semDefaultFalse() throws Exception {
        migrarAte("34");
        UUID usuario = inserirUsuario();
        UUID animal = UUID.randomUUID();

        assertThat(transacao(animal(animal, usuario)), nullValue());

        assertThat(esterilizado(animal), nullValue());
    }

    @Test
    @DisplayName("V30 e V32: so os cargos previstos recebem as permissoes novas")
    void permissoes() {
        migrarAte("34");

        assertThat(cargosComFeature("edicao_registro"), equalTo(List.of(ADMINISTRADOR)));
        assertThat(cargosComFeature("ocorrencias_bairro"), equalTo(List.of(ADMINISTRADOR, AGENTE)));
        assertThat(cargosComFeature("ocorrencias_bairro"), not(hasItem(VETERINARIO)));
    }

    @Test
    @DisplayName("V29: remover o usuario leva as sessoes; o token de renovacao e unico")
    void sessaoUsuario() throws Exception {
        migrarAte("34");
        UUID usuario = inserirUsuario();
        String sessao = "INSERT INTO " + S + "sessao_usuario (usuario_id, token_hash, rotacionado_em, criada_em,"
                + " ultima_atividade_em) VALUES ('" + usuario + "', 'hash-unico', now(), now(), now())";
        assertThat(transacao(sessao), nullValue());

        assertViolacao(transacao(sessao), "uq_sessao_usuario_token_hash");

        assertThat(transacao("DELETE FROM " + S + "usuario WHERE id = '" + usuario + "'"), nullValue());
        assertThat(jdbcTemplate.queryForObject("SELECT count(*) FROM " + S + "sessao_usuario", Integer.class), equalTo(0));
    }

    @Test
    @DisplayName("V34: token de recuperacao unico por hash, e remover o usuario leva os tokens")
    void tokenRecuperacaoSenha() throws Exception {
        migrarAte("34");
        UUID usuario = inserirUsuario();
        String token = "INSERT INTO " + S + "token_recuperacao_senha (usuario_id, token_hash, criado_em, expira_em)"
                + " VALUES ('" + usuario + "', 'hash-recuperacao', now(), now() + interval '1 minute')";
        assertThat(transacao(token), nullValue());

        assertViolacao(transacao(token), "uq_token_recuperacao_senha_token_hash");

        assertThat(transacao("DELETE FROM " + S + "usuario WHERE id = '" + usuario + "'"), nullValue());
        assertThat(jdbcTemplate.queryForObject("SELECT count(*) FROM " + S + "token_recuperacao_senha", Integer.class),
                equalTo(0));
    }

    private Dados inserirDadosNaV28() throws SQLException {
        UUID usuario = inserirUsuario();
        UUID castrado = UUID.randomUUID();
        UUID naoCastrado = UUID.randomUUID();
        UUID processo = UUID.randomUUID();
        UUID amostraSemContato = UUID.randomUUID();
        UUID amostraComContato = UUID.randomUUID();
        assertThat(transacao(
                animal(castrado, usuario),
                animal(naoCastrado, usuario),
                "UPDATE " + S + "animal SET esterilizado = true, observacoes = 'Texto antigo' WHERE id = '" + castrado + "'",
                "UPDATE " + S + "animal SET esterilizado = false WHERE id = '" + naoCastrado + "'",
                processo(processo, usuario),
                responsavel(processo),
                amostraComId(amostraSemContato, processo, "false", "NULL", "NULL"),
                amostraComId(amostraComContato, processo, "true", "'DIRETA'", "true"),
                "INSERT INTO " + S + "auditoria_evento (acao, entidade) VALUES ('LOGIN', 'usuario')"), nullValue());
        return new Dados(castrado, naoCastrado, amostraSemContato, amostraComContato);
    }

    private static String animal(UUID id, UUID usuario) {
        return "INSERT INTO " + S + "animal (id, nome, especie_id, sexo, status_id, motivo_entrada_id, data_entrada,"
                + " criado_por_id) SELECT '" + id + "', 'Animal', e.id, 'macho', s.id, m.id, now(), '" + usuario + "'"
                + " FROM " + S + "especie e, " + S + "status_animal s, " + S + "motivo_entrada m"
                + " WHERE e.codigo = 'canino' AND s.codigo = 'disponivel_adocao' AND m.codigo = 'resgate'";
    }

    private static String processo(UUID id, UUID usuario) {
        return "INSERT INTO " + S + "processo_sanitario (id, protocolo, data_abertura, criado_por_id, doenca_id,"
                + " laboratorio_id, status_processo) SELECT '" + id + "', '" + id.toString().substring(0, 8)
                + "', DATE '2026-10-11', '" + usuario + "', d.id, l.id, 'ABERTO' FROM " + S + "doenca d, "
                + S + "laboratorio l WHERE d.codigo = 'raiva' AND l.codigo = 'pasteur_sp'";
    }

    private static String responsavel(UUID processo) {
        return "INSERT INTO " + S + "responsavel_processo (processo_id, nome) VALUES ('" + processo + "', 'Responsavel')";
    }

    private static String amostra(UUID processo, String contato, String nivel, String agrediu) {
        return amostraComId(UUID.randomUUID(), processo, contato, nivel, agrediu);
    }

    private static String amostraComId(UUID id, UUID processo, String contato, String nivel, String agrediu) {
        return "INSERT INTO " + S + "animal_amostrado (id, processo_id, especie_id, sexo, status_clinico, tipo_abrigo,"
                + " data_coleta, material_biologico, contato_humano, nivel_contato, agrediu_humano) SELECT '" + id + "', '"
                + processo + "', id, 'macho', 'ASSINTOMATICO', 'PERIDOMICILIAR', DATE '2026-10-11', 'SORO', " + contato
                + ", " + nivel + ", " + agrediu + " FROM " + S + "especie WHERE codigo = 'canino'";
    }

    private UUID inserirUsuario() {
        return jdbcTemplate.queryForObject("INSERT INTO " + S + "usuario (email, senha, nome, sobrenome)"
                + " VALUES (?, 'x', 'Migracao', 'Decisoes') RETURNING id", UUID.class,
                "migracao." + UUID.randomUUID().toString().substring(0, 8) + "@itu.sp.gov.br");
    }

    private Boolean esterilizado(UUID animal) {
        return jdbcTemplate.queryForObject("SELECT esterilizado FROM " + S + "animal WHERE id = ?", Boolean.class, animal);
    }

    private Boolean contatoHumano(UUID amostra) {
        return jdbcTemplate.queryForObject("SELECT contato_humano FROM " + S + "animal_amostrado WHERE id = ?",
                Boolean.class, amostra);
    }

    private List<String> cargosComFeature(String feature) {
        return jdbcTemplate.queryForList("SELECT cargo_id::text FROM " + S + "cargo_permissao WHERE feature = ?"
                + " ORDER BY cargo_id", String.class, feature);
    }

    private MigrateResult migrarAte(String versao) {
        return Flyway.configure()
                .dataSource(dataSource)
                .schemas(SCHEMA)
                .locations("classpath:db/migration")
                .target(MigrationVersion.fromVersion(versao))
                .load()
                .migrate();
    }

    // Executa os comandos numa transacao propria e devolve o erro (ou null se confirmou).
    private SQLException transacao(String... comandos) throws SQLException {
        try (Connection conexao = dataSource.getConnection()) {
            conexao.setAutoCommit(false);
            try (Statement statement = conexao.createStatement()) {
                for (String comando : comandos) {
                    statement.execute(comando);
                }
                conexao.commit();
                return null;
            } catch (SQLException erro) {
                conexao.rollback();
                return erro;
            } finally {
                conexao.setAutoCommit(true);
            }
        }
    }

    private static void assertViolacao(SQLException erro, String trecho) {
        assertThat("esperava falha contendo '" + trecho + "'", erro == null ? "" : erro.getMessage(), containsString(trecho));
    }
}
