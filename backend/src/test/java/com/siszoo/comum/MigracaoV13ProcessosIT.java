package com.siszoo.comum;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.nullValue;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.TimeUnit;

import javax.sql.DataSource;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.FlywayException;
import org.flywaydb.core.api.MigrationVersion;
import org.flywaydb.core.api.output.MigrateResult;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;

// Exercita a V13 (processos sanitarios, T29) num schema proprio do mesmo
// PostgreSQL de teste, no padrao de MigracaoV12AuditoriaIT: do zero, por
// atualizacao a partir da V12 e recusada com processo minimo legado (DH-3).
//
// As constraint triggers adiaveis disparam no COMMIT, entao as transacoes
// usam conexoes JDBC proprias (autocommit desligado), sem o Spring no meio.
// A conexao usa o search_path padrao (public, onde a aplicacao tem as mesmas
// tabelas): o teste tambem prova que as funcoes da V13 consultam o schema em
// que foram criadas (SET search_path FROM CURRENT).
class MigracaoV13ProcessosIT extends AbstractIntegrationTest {

    private static final String SCHEMA = "migracao_v13";
    private static final String S = SCHEMA + ".";

    @Autowired
    private DataSource dataSource;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @AfterEach
    void removerSchemaDoTeste() {
        jdbcTemplate.execute("DROP SCHEMA IF EXISTS " + SCHEMA + " CASCADE");
    }

    // ── Aplicacao da migration ───────────────────────────

    @Test
    @DisplayName("[T29] V13 aplica do zero sobre V1-V12 e semeia os catalogos do DER")
    void v13DeveAplicarDoZero() {
        MigrateResult resultado = migrarAte("13");

        assertThat(resultado.success, equalTo(true));
        assertThat(resultado.targetSchemaVersion, equalTo("13"));
        assertThat(codigos("doenca"), containsInAnyOrder("raiva", "esporotricose", "leishmaniose_visceral",
                "leptospirose", "febre_maculosa", "febre_amarela"));
        assertThat(jdbcTemplate.queryForObject("SELECT cid FROM " + S + "doenca WHERE codigo = 'leishmaniose_visceral'",
                String.class), equalTo("B55.0"));
        assertThat(codigos("laboratorio"), containsInAnyOrder("pasteur_sp", "ial_sorocaba", "ccz_sp", "itu_ll01"));
        assertThat(jdbcTemplate.queryForObject("SELECT count(*) FROM " + S + "laboratorio"
                + " WHERE tipo IS NOT NULL OR contato IS NOT NULL", Integer.class), equalTo(0));
        assertThat(codigos("sintoma"), containsInAnyOrder("apatia", "alt_comportamental", "descamacao", "ulcera_pele",
                "ceratoconjuntivite", "coriza", "emagrecimento", "diarreia", "salivacao_excessiva",
                "hemorragia_interna", "vomito", "aumento_linfonodo"));
        assertThat(codigos("resultado_laboratorial"), containsInAnyOrder("aguardando", "positivo", "negativo",
                "inconclusivo", "material_inadequado", "nao_realizado"));
        assertThat(codigos("desfecho_animal"), containsInAnyOrder("em_acompanhamento", "obito_natural",
                "obito_eutanasia", "obito_outro"));
    }

    @Test
    @DisplayName("[DH-3] V13 sobre V12 sem processos preserva os dados existentes")
    void v13SobreV12SemProcessos() {
        migrarAte("12");
        UUID usuario = inserirUsuario();
        UUID ocorrencia = inserirOcorrencia(usuario);

        MigrateResult resultado = migrarAte("13");

        assertThat(resultado.success, equalTo(true));
        assertThat(jdbcTemplate.queryForObject("SELECT count(*) FROM " + S + "ocorrencia WHERE id = ?",
                Integer.class, ocorrencia), equalTo(1));
    }

    @Test
    @DisplayName("[DH-3] V13 com processo minimo da T25 falha, pede para recriar o banco e nao cria nada")
    void v13FalhaComProcessoLegado() {
        migrarAte("12");
        UUID usuario = inserirUsuario();
        jdbcTemplate.update("INSERT INTO " + S + "processo_sanitario (protocolo, data_abertura, criado_por_id)"
                + " VALUES ('001/2026', DATE '2026-10-11', ?)", usuario);

        FlywayException erro = assertThrows(FlywayException.class, () -> migrarAte("13"));

        assertThat(erro.getMessage(), containsString("recrie o banco de desenvolvimento"));
        assertThat(jdbcTemplate.queryForObject("SELECT to_regclass('" + S + "doenca')", String.class), nullValue());
        assertThat(jdbcTemplate.queryForObject("SELECT count(*) FROM " + S + "processo_sanitario", Integer.class),
                equalTo(1));
    }

    // ── 1 responsavel e >= 1 amostra (DH-2) ─────────────

    @Test
    @DisplayName("[DH-2] processo completo e aceito; sem amostra ou sem responsavel falha no COMMIT")
    void processoExigeResponsavelEAmostra() throws Exception {
        migrarAte("13");
        UUID usuario = inserirUsuario();

        UUID completo = UUID.randomUUID();
        assertThat(transacao(processo(completo, usuario), responsavel(completo), amostra(UUID.randomUUID(), completo)),
                nullValue());

        UUID semAmostra = UUID.randomUUID();
        SQLException erroAmostra = transacao(processo(semAmostra, usuario), responsavel(semAmostra));
        assertViolacao(erroAmostra, "sem animal amostrado");

        UUID semResponsavel = UUID.randomUUID();
        SQLException erroResponsavel = transacao(processo(semResponsavel, usuario), amostra(UUID.randomUUID(), semResponsavel));
        assertViolacao(erroResponsavel, "sem responsável");

        assertThat(jdbcTemplate.queryForObject("SELECT count(*) FROM " + S + "processo_sanitario", Integer.class),
                equalTo(1));
    }

    @Test
    @DisplayName("[DH-2] remover uma de duas amostras e aceito; a ultima, o responsavel ou mover a ultima amostra, nao")
    void processoMantemResponsavelEAmostra() throws Exception {
        migrarAte("13");
        UUID usuario = inserirUsuario();
        UUID processo = UUID.randomUUID();
        UUID outroProcesso = UUID.randomUUID();
        UUID amostra1 = UUID.randomUUID();
        UUID amostra2 = UUID.randomUUID();
        UUID amostraOutro = UUID.randomUUID();
        transacao(processo(processo, usuario), responsavel(processo), amostra(amostra1, processo), amostra(amostra2, processo));
        transacao(processo(outroProcesso, usuario), responsavel(outroProcesso), amostra(amostraOutro, outroProcesso));

        assertThat(transacao("DELETE FROM " + S + "animal_amostrado WHERE id = '" + amostra1 + "'"), nullValue());
        assertViolacao(transacao("DELETE FROM " + S + "animal_amostrado WHERE id = '" + amostra2 + "'"),
                "ficaria sem animal amostrado");
        assertViolacao(transacao("UPDATE " + S + "animal_amostrado SET processo_id = '" + outroProcesso
                + "' WHERE id = '" + amostra2 + "'"), "ficaria sem animal amostrado");
        assertViolacao(transacao("DELETE FROM " + S + "responsavel_processo WHERE processo_id = '" + processo + "'"),
                "ficaria sem responsável");

        assertThat(jdbcTemplate.queryForObject("SELECT count(*) FROM " + S + "animal_amostrado WHERE processo_id = ?",
                Integer.class, processo), equalTo(1));
    }

    @Test
    // Ate a V16 esta transacao passava (os triggers adiaveis da V13 nao cobram
    // um processo removido). A V17 (RN06) recusa o DELETE do processo, e a
    // transacao inteira e desfeita.
    @DisplayName("[DH-2/RN06] processo removido inteiro na mesma transacao: recusado com 23514 desde a V17")
    void removerProcessoInteiro() throws Exception {
        migrarAte("17");
        UUID usuario = inserirUsuario();
        UUID processo = UUID.randomUUID();
        transacao(processo(processo, usuario), responsavel(processo), amostra(UUID.randomUUID(), processo));

        assertViolacao(transacao(
                "DELETE FROM " + S + "animal_amostrado WHERE processo_id = '" + processo + "'",
                "DELETE FROM " + S + "responsavel_processo WHERE processo_id = '" + processo + "'",
                "DELETE FROM " + S + "processo_sanitario WHERE id = '" + processo + "'"), "não pode ser excluído");
        assertThat(jdbcTemplate.queryForObject("SELECT count(*) FROM " + S + "animal_amostrado WHERE processo_id = ?",
                Integer.class, processo), equalTo(1));
    }

    @Test
    @DisplayName("[DH-2] duas transacoes concorrentes removendo amostras diferentes do mesmo processo: so uma confirma")
    void remocoesConcorrentesNaoDeixamProcessoSemAmostra() throws Exception {
        migrarAte("13");
        UUID usuario = inserirUsuario();
        UUID processo = UUID.randomUUID();
        UUID amostra1 = UUID.randomUUID();
        UUID amostra2 = UUID.randomUUID();
        transacao(processo(processo, usuario), responsavel(processo), amostra(amostra1, processo), amostra(amostra2, processo));

        // As duas removem antes de qualquer COMMIT (as linhas sao diferentes,
        // nao ha bloqueio no DELETE); depois confirmam juntas. A trava na linha
        // do processo serializa a verificacao: a segunda ve a remocao da primeira.
        CyclicBarrier removidas = new CyclicBarrier(2);
        CompletableFuture<SQLException> primeira = CompletableFuture.supplyAsync(() -> removerECommitar(amostra1, removidas));
        CompletableFuture<SQLException> segunda = CompletableFuture.supplyAsync(() -> removerECommitar(amostra2, removidas));

        List<SQLException> resultados = new ArrayList<>();
        resultados.add(primeira.get(30, TimeUnit.SECONDS));
        resultados.add(segunda.get(30, TimeUnit.SECONDS));
        assertThat(resultados.stream().filter(erro -> erro == null).count(), equalTo(1L));
        assertViolacao(resultados.stream().filter(erro -> erro != null).findFirst().orElseThrow(),
                "ficaria sem animal amostrado");
        assertThat(jdbcTemplate.queryForObject("SELECT count(*) FROM " + S + "animal_amostrado WHERE processo_id = ?",
                Integer.class, processo), equalTo(1));
    }

    // ── Vinculo imutavel (DER regra 15) ─────────────────

    @Test
    @DisplayName("[DER 15] vinculo: vazio -> ocorrencia aceito; trocar ou remover recusado; atualizar o resto aceito")
    void vinculoImutavel() throws Exception {
        migrarAte("13");
        UUID usuario = inserirUsuario();
        UUID ocorrencia = inserirOcorrencia(usuario);
        UUID outraOcorrencia = inserirOcorrencia(usuario);
        UUID processo = UUID.randomUUID();
        transacao(processo(processo, usuario), responsavel(processo), amostra(UUID.randomUUID(), processo));
        String onde = " WHERE id = '" + processo + "'";

        jdbcTemplate.update("UPDATE " + S + "processo_sanitario SET ocorrencia_id = ?" + onde, ocorrencia);

        // A mensagem do trigger e o texto do RAISE (o nome da constraint vai so
        // no campo CONSTRAINT do erro, com SQLSTATE 23514).
        assertViolacao(transacao("UPDATE " + S + "processo_sanitario SET ocorrencia_id = '" + outraOcorrencia + "'"
                + onde), "é imutável");
        assertViolacao(transacao("UPDATE " + S + "processo_sanitario SET ocorrencia_id = NULL" + onde), "é imutável");
        jdbcTemplate.update("UPDATE " + S + "processo_sanitario SET status_processo = 'AGUARDANDO_RESULTADO',"
                + " ocorrencia_id = ocorrencia_id" + onde);

        assertThat(jdbcTemplate.queryForObject("SELECT ocorrencia_id FROM " + S + "processo_sanitario" + onde, UUID.class),
                equalTo(ocorrencia));
    }

    // ── CHECKs, UNIQUE e PK ─────────────────────────────

    @Test
    @DisplayName("[T29] CHECKs da amostra e do responsavel, responsavel unico por processo e sintoma unico por amostra")
    void constraintsDasTabelas() throws Exception {
        migrarAte("13");
        UUID usuario = inserirUsuario();
        UUID processo = UUID.randomUUID();
        UUID amostra = UUID.randomUUID();
        transacao(processo(processo, usuario), responsavel(processo), amostra(amostra, processo));

        String colunas = "INSERT INTO " + S + "animal_amostrado (processo_id, especie_id, sexo, pelagem, peso_kg,"
                + " status_clinico, tipo_abrigo, data_coleta, material_biologico, contato_humano, nivel_contato,"
                + " agrediu_humano) SELECT '" + processo + "', e.id, ";
        String especie = " FROM " + S + "especie e WHERE e.codigo = 'canino'";
        verificar("ck_animal_amostrado_contato", () -> jdbcTemplate.update(colunas
                + "'macho', NULL, NULL, 'OBITO', 'SILVESTRE', DATE '2026-10-01', 'SORO', true, NULL, NULL" + especie));
        verificar("ck_animal_amostrado_contato", () -> jdbcTemplate.update(colunas
                + "'macho', NULL, NULL, 'OBITO', 'SILVESTRE', DATE '2026-10-01', 'SORO', false, 'DIRETA', NULL" + especie));
        verificar("ck_animal_amostrado_sexo", () -> jdbcTemplate.update(colunas
                + "'MACHO', NULL, NULL, 'OBITO', 'SILVESTRE', DATE '2026-10-01', 'SORO', false, NULL, NULL" + especie));
        verificar("ck_animal_amostrado_pelagem", () -> jdbcTemplate.update(colunas
                + "'macho', 'CURTA', NULL, 'OBITO', 'SILVESTRE', DATE '2026-10-01', 'SORO', false, NULL, NULL" + especie));
        verificar("ck_animal_amostrado_peso_kg", () -> jdbcTemplate.update(colunas
                + "'macho', NULL, 0, 'OBITO', 'SILVESTRE', DATE '2026-10-01', 'SORO', false, NULL, NULL" + especie));
        verificar("ck_animal_amostrado_status_clinico", () -> jdbcTemplate.update(colunas
                + "'macho', NULL, NULL, 'obito', 'SILVESTRE', DATE '2026-10-01', 'SORO', false, NULL, NULL" + especie));
        verificar("ck_animal_amostrado_tipo_abrigo", () -> jdbcTemplate.update(colunas
                + "'macho', NULL, NULL, 'OBITO', 'URBANO', DATE '2026-10-01', 'SORO', false, NULL, NULL" + especie));
        verificar("ck_animal_amostrado_material_biologico", () -> jdbcTemplate.update(colunas
                + "'macho', NULL, NULL, 'OBITO', 'SILVESTRE', DATE '2026-10-01', 'SWAB', false, NULL, NULL" + especie));
        verificar("ck_animal_amostrado_nivel_contato", () -> jdbcTemplate.update(colunas
                + "'macho', NULL, NULL, 'OBITO', 'SILVESTRE', DATE '2026-10-01', 'SORO', true, 'NENHUM', false" + especie));

        verificar("uq_responsavel_processo_processo_id", () -> jdbcTemplate.update(
                "INSERT INTO " + S + "responsavel_processo (processo_id, nome) VALUES (?, 'Outro')", processo));
        verificar("ck_responsavel_processo_nome", () -> jdbcTemplate.update(
                "UPDATE " + S + "responsavel_processo SET nome = '   ' WHERE processo_id = ?", processo));

        String sintoma = "INSERT INTO " + S + "amostra_sintoma (animal_amostrado_id, sintoma_id)"
                + " SELECT '" + amostra + "', id FROM " + S + "sintoma WHERE codigo = 'apatia'";
        jdbcTemplate.update(sintoma);
        verificar("pk_amostra_sintoma", () -> jdbcTemplate.update(sintoma));
        verificar("fk_animal_amostrado_animal", () -> jdbcTemplate.update(
                "UPDATE " + S + "animal_amostrado SET animal_id = ? WHERE id = ?", UUID.randomUUID(), amostra));
    }

    // ── Apoio ──

    private MigrateResult migrarAte(String versao) {
        return Flyway.configure()
                .dataSource(dataSource)
                .schemas(SCHEMA)
                .locations("classpath:db/migration")
                .target(MigrationVersion.fromVersion(versao))
                .load()
                .migrate();
    }

    // Executa os comandos numa transacao propria e devolve o erro do COMMIT
    // (ou de um comando), ou null se confirmou.
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

    private SQLException removerECommitar(UUID amostra, CyclicBarrier removidas) {
        try (Connection conexao = dataSource.getConnection()) {
            conexao.setAutoCommit(false);
            try (Statement statement = conexao.createStatement()) {
                statement.execute("DELETE FROM " + S + "animal_amostrado WHERE id = '" + amostra + "'");
                removidas.await(10, TimeUnit.SECONDS);
                conexao.commit();
                return null;
            } catch (SQLException erro) {
                conexao.rollback();
                return erro;
            } finally {
                conexao.setAutoCommit(true);
            }
        } catch (Exception erro) {
            throw new IllegalStateException(erro);
        }
    }

    private static void assertViolacao(SQLException erro, String trecho) {
        assertThat("esperava falha contendo '" + trecho + "'", erro == null ? null : erro.getSQLState(), equalTo("23514"));
        assertThat(erro.getMessage(), containsString(trecho));
    }

    private void verificar(String constraintEsperada, Runnable comando) {
        DataIntegrityViolationException erro = assertThrows(DataIntegrityViolationException.class, comando::run);
        assertThat(erro.getMessage(), containsString(constraintEsperada));
    }

    private static String processo(UUID id, UUID usuario) {
        return "INSERT INTO " + S + "processo_sanitario (id, protocolo, data_abertura, criado_por_id, doenca_id,"
                + " laboratorio_id) SELECT '" + id + "', '" + protocoloUnico() + "', DATE '2026-10-11', '" + usuario
                + "', d.id, l.id FROM " + S + "doenca d, " + S + "laboratorio l"
                + " WHERE d.codigo = 'raiva' AND l.codigo = 'pasteur_sp'";
    }

    private static String responsavel(UUID processo) {
        return "INSERT INTO " + S + "responsavel_processo (processo_id, nome) VALUES ('" + processo + "', 'Responsavel')";
    }

    private static String amostra(UUID id, UUID processo) {
        return "INSERT INTO " + S + "animal_amostrado (id, processo_id, especie_id, sexo, status_clinico, tipo_abrigo,"
                + " data_coleta, material_biologico, contato_humano) SELECT '" + id + "', '" + processo
                + "', id, 'macho', 'ASSINTOMATICO', 'PERIDOMICILIAR', DATE '2026-10-11', 'SORO', false"
                + " FROM " + S + "especie WHERE codigo = 'canino'";
    }

    private UUID inserirUsuario() {
        return jdbcTemplate.queryForObject("INSERT INTO " + S + "usuario (email, senha, nome, sobrenome)"
                + " VALUES (?, 'x', 'Migracao', 'Processo') RETURNING id", UUID.class,
                "migracao." + UUID.randomUUID().toString().substring(0, 8) + "@itu.sp.gov.br");
    }

    private UUID inserirOcorrencia(UUID usuario) {
        return jdbcTemplate.queryForObject("INSERT INTO " + S + "ocorrencia"
                + " (protocolo, tipo_ocorrencia_id, data_abertura, endereco, bairro, descricao, registrado_por_id)"
                + " SELECT ?, id, DATE '2026-10-11', 'Rua Teste, 1', 'Centro', 'Descricao', ?"
                + " FROM " + S + "tipo_ocorrencia WHERE codigo = 'zoonose' RETURNING id", UUID.class,
                protocoloUnico(), usuario);
    }

    private List<String> codigos(String tabela) {
        return jdbcTemplate.queryForList("SELECT codigo FROM " + S + tabela, String.class);
    }

    // Protocolo so precisa ser unico dentro do schema do teste (varchar(20)).
    private static String protocoloUnico() {
        return "T" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }
}
