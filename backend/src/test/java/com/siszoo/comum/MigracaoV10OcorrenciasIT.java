package com.siszoo.comum;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Stream;

import javax.sql.DataSource;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationVersion;
import org.flywaydb.core.api.output.MigrateResult;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;

// Exercita a V10 (T25 — ocorrências) num schema proprio do mesmo PostgreSQL de
// teste, migrado por API ate a V10, no padrao de MigracaoV7RegistroClinicoIT.
// Os casos gravam direto em SQL, sem a API: o objetivo e provar que as
// constraints barram o dado invalido mesmo que o service seja contornado.
// O schema e criado uma vez por classe; cada caso usa protocolo proprio, entao
// os INSERTs que passam nao interferem entre si.
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class MigracaoV10OcorrenciasIT extends AbstractIntegrationTest {

    private static final String SCHEMA = "migracao_v10";

    private static final String CARGO_ADMINISTRADOR_ID = "00000000-0000-4000-8000-000000000001";
    private static final String CARGO_VETERINARIO_ID = "00000000-0000-4000-8000-000000000002";
    private static final String CARGO_AGENTE_SANITARIO_ID = "00000000-0000-4000-8000-000000000003";

    @Autowired
    private DataSource dataSource;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private MigrateResult resultadoMigracao;
    private UUID usuarioId;
    private UUID ocorrenciaBaseId;

    @BeforeAll
    void migrarSchemaDoTeste() {
        jdbcTemplate.execute("DROP SCHEMA IF EXISTS " + SCHEMA + " CASCADE");
        resultadoMigracao = Flyway.configure()
                .dataSource(dataSource)
                .schemas(SCHEMA)
                .locations("classpath:db/migration")
                .target(MigrationVersion.fromVersion("10"))
                .load()
                .migrate();

        usuarioId = jdbcTemplate.queryForObject("INSERT INTO " + SCHEMA + ".usuario (email, senha, nome, sobrenome)"
                + " VALUES ('migracao.ocorrencia@itu.sp.gov.br', 'x', 'Migracao', 'Ocorrencia') RETURNING id", UUID.class);
        ocorrenciaBaseId = inserirOcorrencia("ABERTA", false, false, false, false, false, false, null, null);
    }

    @AfterAll
    void removerSchemaDoTeste() {
        jdbcTemplate.execute("DROP SCHEMA IF EXISTS " + SCHEMA + " CASCADE");
    }

    @Test
    @DisplayName("V10 aplica do zero sobre V1-V9")
    void v10DeveAplicarDoZero() {
        assertThat(resultadoMigracao.success, equalTo(true));
        assertThat(resultadoMigracao.targetSchemaVersion, equalTo("10"));
    }

    // ── D25/D29: campos de encerramento existem se, e somente se, ENCERRADA ──

    static Stream<Arguments> casosEncerramento() {
        String ck = "ck_ocorrencia_encerramento";
        return Stream.of(
                // status, providencia, encerrada_em, encerrada_por, descricao_encerramento, constraint violada
                Arguments.of("ENCERRADA sem providencia", "ENCERRADA", false, true, true, false, ck),
                Arguments.of("ENCERRADA sem encerrada_em", "ENCERRADA", true, false, true, false, ck),
                Arguments.of("ENCERRADA sem encerrada_por", "ENCERRADA", true, true, false, false, ck),
                Arguments.of("ABERTA so com providencia", "ABERTA", true, false, false, false, ck),
                Arguments.of("ABERTA so com encerrada_em", "ABERTA", false, true, false, false, ck),
                Arguments.of("ABERTA so com encerrada_por", "ABERTA", false, false, true, false, ck),
                Arguments.of("EM_ATENDIMENTO so com providencia", "EM_ATENDIMENTO", true, false, false, false, ck),
                Arguments.of("EM_ATENDIMENTO so com encerrada_em", "EM_ATENDIMENTO", false, true, false, false, ck),
                Arguments.of("EM_ATENDIMENTO so com encerrada_por", "EM_ATENDIMENTO", false, false, true, false, ck),
                Arguments.of("ENCERRADA completa", "ENCERRADA", true, true, true, false, null),
                Arguments.of("ABERTA sem campos de encerramento", "ABERTA", false, false, false, false, null),
                Arguments.of("EM_ATENDIMENTO sem campos de encerramento", "EM_ATENDIMENTO", false, false, false, false, null),
                Arguments.of("status_ocorrencia nulo", null, false, false, false, false, "status_ocorrencia"),
                Arguments.of("ABERTA com descricao_encerramento", "ABERTA", false, false, false, true, ck),
                Arguments.of("EM_ATENDIMENTO com descricao_encerramento", "EM_ATENDIMENTO", false, false, false, true, ck));
    }

    @ParameterizedTest(name = "[D25] {0}")
    @MethodSource("casosEncerramento")
    void encerramentoDeveSerCoerenteComOStatus(String caso, String status, boolean providencia, boolean encerradaEm,
            boolean encerradaPor, boolean descricaoEncerramento, String constraintEsperada) {
        verificar(constraintEsperada, () -> inserirOcorrencia(
                status, providencia, encerradaEm, encerradaPor, descricaoEncerramento, false, false, null, null));
    }

    // ── D32: anonima e sigilosa sao excludentes ──

    static Stream<Arguments> casosAnonimaSigilosa() {
        return Stream.of(
                Arguments.of("anonima e sigilosa", true, true, "ck_ocorrencia_anonima_sigilosa"),
                Arguments.of("so anonima", true, false, null),
                Arguments.of("so sigilosa", false, true, null));
    }

    @ParameterizedTest(name = "[D32] {0}")
    @MethodSource("casosAnonimaSigilosa")
    void anonimaESigilosaNaoPodemSerAmbasVerdadeiras(String caso, boolean anonima, boolean sigilosa,
            String constraintEsperada) {
        verificar(constraintEsperada, () -> inserirOcorrencia(
                "ABERTA", false, false, false, false, anonima, sigilosa, null, null));
    }

    // ── Faixas geograficas (nulos permitidos) ──

    static Stream<Arguments> casosCoordenadas() {
        return Stream.of(
                Arguments.of("lat -90 / lon -180", "-90", "-180", null),
                Arguments.of("lat 90 / lon 180", "90", "180", null),
                Arguments.of("lat e lon nulos", null, null, null),
                Arguments.of("coordenada de Itu", "-23.264", "-47.299", null),
                Arguments.of("lat 90.000001", "90.000001", "0", "ck_ocorrencia_latitude"),
                Arguments.of("lat -90.000001", "-90.000001", "0", "ck_ocorrencia_latitude"),
                Arguments.of("lon 180.000001", "0", "180.000001", "ck_ocorrencia_longitude"),
                Arguments.of("lon -180.000001", "0", "-180.000001", "ck_ocorrencia_longitude"));
    }

    @ParameterizedTest(name = "[geo] {0}")
    @MethodSource("casosCoordenadas")
    void coordenadasDevemEstarNaFaixaValida(String caso, String latitude, String longitude, String constraintEsperada) {
        verificar(constraintEsperada, () -> inserirOcorrencia(
                "ABERTA", false, false, false, false, false, false, latitude, longitude));
    }

    // ── D4/D5/D37: movimentacao amarrada a transicao e nota com descricao ──

    static Stream<Arguments> casosMovimentacao() {
        String transicao = "ck_movimentacao_ocorrencia_transicao";
        return Stream.of(
                // tipo, status_anterior, status_novo, descricao, com data, constraint violada
                Arguments.of("REGISTRADA nulo -> ABERTA", "REGISTRADA", null, "ABERTA", null, true, null),
                Arguments.of("EQUIPE_DESPACHADA ABERTA -> EM_ATENDIMENTO", "EQUIPE_DESPACHADA", "ABERTA", "EM_ATENDIMENTO", null, true, null),
                Arguments.of("ENCERRADA ABERTA -> ENCERRADA", "ENCERRADA", "ABERTA", "ENCERRADA", null, true, null),
                Arguments.of("ENCERRADA EM_ATENDIMENTO -> ENCERRADA", "ENCERRADA", "EM_ATENDIMENTO", "ENCERRADA", null, true, null),
                Arguments.of("PROCESSO_VINCULADO sem status", "PROCESSO_VINCULADO", null, null, null, true, null),
                Arguments.of("EQUIPE_DESPACHADA EM_ATENDIMENTO -> ABERTA", "EQUIPE_DESPACHADA", "EM_ATENDIMENTO", "ABERTA", null, true, transicao),
                Arguments.of("REGISTRADA com status anterior", "REGISTRADA", "ABERTA", "ABERTA", null, true, transicao),
                Arguments.of("NOTA_INTERNA sem descricao", "NOTA_INTERNA", null, null, null, true, "ck_movimentacao_ocorrencia_nota_descricao"),
                Arguments.of("NOTA_INTERNA com descricao em branco", "NOTA_INTERNA", null, null, "   ", true, "ck_movimentacao_ocorrencia_nota_descricao"),
                Arguments.of("NOTA_INTERNA com status", "NOTA_INTERNA", "ABERTA", "ABERTA", "liguei", true, transicao),
                Arguments.of("NOTA_INTERNA com descricao", "NOTA_INTERNA", null, null, "liguei, ninguem atendeu", true, null),
                Arguments.of("tipo desconhecido", "REABERTURA", "ENCERRADA", "ABERTA", null, true, "ck_movimentacao_ocorrencia_tipo"),
                Arguments.of("sem data (D39: sem DEFAULT)", "NOTA_INTERNA", null, null, "x", false, "\"data\""));
    }

    @ParameterizedTest(name = "[D5] {0}")
    @MethodSource("casosMovimentacao")
    void movimentacaoDeveRespeitarAMatrizDeTransicoes(String caso, String tipo, String statusAnterior,
            String statusNovo, String descricao, boolean comData, String constraintEsperada) {
        String colunaData = comData ? "data, " : "";
        String valorData = comData ? "TIMESTAMP '2026-10-11 10:00', " : "";
        verificar(constraintEsperada, () -> jdbcTemplate.update("INSERT INTO " + SCHEMA + ".movimentacao_ocorrencia"
                + " (" + colunaData + "ocorrencia_id, usuario_id, tipo_movimentacao, status_anterior, status_novo, descricao)"
                + " VALUES (" + valorData + "?, ?, ?, CAST(? AS varchar), CAST(? AS varchar), CAST(? AS text))",
                ocorrenciaBaseId, usuarioId, tipo, statusAnterior, statusNovo, descricao));
    }

    // ── D13: sequencia de protocolo por entidade e ano ──

    @Test
    @DisplayName("[D13] protocolo_sequencia recusa entidade fora da lista")
    void sequenciaDeveRecusarEntidadeDesconhecida() {
        verificar("ck_protocolo_sequencia_entidade", () -> jdbcTemplate.update(
                "INSERT INTO " + SCHEMA + ".protocolo_sequencia (entidade, ano, ultimo) VALUES ('ANIMAL', 2026, 1)"));
    }

    @Test
    @DisplayName("[D13] upsert da sequencia incrementa por entidade e ano, sem misturar entidades")
    void sequenciaDeveIncrementarPorEntidadeEAno() {
        assertThat(proximoProtocolo("OCORRENCIA", 2030), equalTo(1));
        assertThat(proximoProtocolo("OCORRENCIA", 2030), equalTo(2));
        assertThat(proximoProtocolo("PROCESSO", 2030), equalTo(1));
        assertThat(proximoProtocolo("OCORRENCIA", 2031), equalTo(1));
    }

    // ── D2: vinculo unico processo-ocorrencia e status do processo ──

    @Test
    @DisplayName("[D2] uma ocorrencia so pode ter um processo vinculado")
    void ocorrenciaDeveTerNoMaximoUmProcesso() {
        UUID ocorrenciaId = inserirOcorrencia("ABERTA", false, false, false, false, false, false, null, null);
        inserirProcesso(ocorrenciaId, "ABERTO");

        verificar("uq_processo_sanitario_ocorrencia_id", () -> inserirProcesso(ocorrenciaId, "ABERTO"));
    }

    @Test
    @DisplayName("[D2] processos sem vinculo podem coexistir (UNIQUE ignora nulos)")
    void processosSemVinculoDevemCoexistir() {
        inserirProcesso(null, "ABERTO");
        inserirProcesso(null, "ABERTO");
    }

    @Test
    @DisplayName("[D38] status_processo exige o valor em maiusculas")
    void statusProcessoDeveSerMaiusculo() {
        verificar("ck_processo_sanitario_status", () -> inserirProcesso(null, "aberto"));
    }

    // ── D9: anexos ──

    static Stream<Arguments> casosAnexo() {
        return Stream.of(
                Arguments.of("PDF de 5 MB", "application/pdf", 5_242_880, null),
                Arguments.of("arquivo de 6 MB", "application/pdf", 6_000_000, "ck_anexo_ocorrencia_tamanho"),
                Arguments.of("arquivo vazio", "image/png", 0, "ck_anexo_ocorrencia_tamanho"),
                Arguments.of("GIF", "image/gif", 10, "ck_anexo_ocorrencia_mime_type"));
    }

    @ParameterizedTest(name = "[D9] {0}")
    @MethodSource("casosAnexo")
    void anexoDeveRespeitarTipoETamanho(String caso, String mimeType, int tamanho, String constraintEsperada) {
        verificar(constraintEsperada, () -> jdbcTemplate.update("INSERT INTO " + SCHEMA + ".anexo_ocorrencia"
                + " (ocorrencia_id, nome, mime_type, tamanho, criado_por_id) VALUES (?, 'arquivo', ?, ?, ?)",
                ocorrenciaBaseId, mimeType, tamanho, usuarioId));
    }

    // ── Seeds ──

    @Test
    @DisplayName("[D1] seed de tipo_ocorrencia segue DER §6")
    void seedTipoOcorrencia() {
        assertThat(codigos("tipo_ocorrencia"), containsInAnyOrder("zoonose", "morcegos", "irregular", "agressivo", "outros"));
    }

    @Test
    @DisplayName("[D1/D34] seed de providencia_tomada segue DER §6 mais registro_indevido")
    void seedProvidenciaTomada() {
        assertThat(codigos("providencia_tomada"), containsInAnyOrder("orientacao_municipe", "encaminhamento_gepar",
                "abertura_processo", "captura_remocao", "sem_acao", "outro", "registro_indevido"));
    }

    @Test
    @DisplayName("[D6] feature denunciante_sigiloso so para Administrador e Agente Sanitario, so leitura")
    void featureDeSigiloSoParaAdministradorEAgente() {
        List<Map<String, Object>> linhas = jdbcTemplate.queryForList("SELECT CAST(cargo_id AS varchar) AS cargo_id,"
                + " leitura, escrita, exclusao FROM " + SCHEMA + ".cargo_permissao"
                + " WHERE modulo = 'OCORRENCIAS_DENUNCIAS' AND feature = 'denunciante_sigiloso'");

        assertThat(linhas.stream().map(l -> (String) l.get("cargo_id")).toList(),
                containsInAnyOrder(CARGO_ADMINISTRADOR_ID, CARGO_AGENTE_SANITARIO_ID));
        for (Map<String, Object> linha : linhas) {
            assertThat(linha.get("leitura"), equalTo(true));
            assertThat(linha.get("escrita"), equalTo(false));
            assertThat(linha.get("exclusao"), equalTo(false));
        }
        assertThat(jdbcTemplate.queryForObject("SELECT count(*) FROM " + SCHEMA + ".cargo_permissao"
                + " WHERE cargo_id = CAST(? AS uuid) AND feature = 'denunciante_sigiloso'", Integer.class,
                CARGO_VETERINARIO_ID), equalTo(0));
    }

    @Test
    @DisplayName("[D6/D34] reexecutar o seed da V10 nao duplica linhas (ON CONFLICT DO NOTHING)")
    void seedDeveSerIdempotente() throws IOException {
        int tipos = contar("tipo_ocorrencia");
        int providencias = contar("providencia_tomada");
        int permissoes = contar("cargo_permissao");

        // Reaplica so os INSERTs de seed da propria V10, qualificados com o schema do teste.
        String v10 = new ClassPathResource("db/migration/V10__schema_ocorrencias.sql")
                .getContentAsString(StandardCharsets.UTF_8);
        String seed = v10.substring(v10.indexOf("INSERT INTO tipo_ocorrencia"))
                .replace("INSERT INTO ", "INSERT INTO " + SCHEMA + ".");
        for (String comando : seed.split(";")) {
            String sql = comando.lines().filter(linha -> !linha.trim().startsWith("--"))
                    .reduce("", (a, b) -> a + "\n" + b).trim();
            if (!sql.isEmpty()) {
                jdbcTemplate.update(sql);
            }
        }

        assertThat(contar("tipo_ocorrencia"), equalTo(tipos));
        assertThat(contar("providencia_tomada"), equalTo(providencias));
        assertThat(contar("cargo_permissao"), equalTo(permissoes));
    }

    // ── Apoio ──

    private void verificar(String constraintEsperada, Runnable insercao) {
        if (constraintEsperada == null) {
            insercao.run();
            return;
        }
        DataIntegrityViolationException erro = assertThrows(DataIntegrityViolationException.class, insercao::run);
        assertThat(erro.getMessage(), containsString(constraintEsperada));
    }

    private UUID inserirOcorrencia(String status, boolean providencia, boolean encerradaEm, boolean encerradaPor,
            boolean descricaoEncerramento, boolean anonima, boolean sigilosa, String latitude, String longitude) {
        return jdbcTemplate.queryForObject("INSERT INTO " + SCHEMA + ".ocorrencia"
                + " (protocolo, tipo_ocorrencia_id, status_ocorrencia, data_abertura, endereco, bairro, descricao,"
                + " registrado_por_id, providencia_tomada_id, encerrada_em, encerrada_por_id, descricao_encerramento,"
                + " anonima, sigilosa, latitude, longitude)"
                + " SELECT ?, t.id, CAST(? AS varchar), DATE '2026-10-11', 'Rua Teste, 1', 'Centro', 'Descricao',"
                + " ?, CASE WHEN ? THEN p.id END, CASE WHEN ? THEN TIMESTAMP '2026-10-11 12:00' END,"
                + " CASE WHEN ? THEN CAST(? AS uuid) END, CASE WHEN ? THEN 'Encerrada' END,"
                + " ?, ?, CAST(? AS numeric), CAST(? AS numeric)"
                + " FROM " + SCHEMA + ".tipo_ocorrencia t, " + SCHEMA + ".providencia_tomada p"
                + " WHERE t.codigo = 'zoonose' AND p.codigo = 'sem_acao' RETURNING id", UUID.class,
                protocoloUnico(), status, usuarioId, providencia, encerradaEm, encerradaPor, usuarioId,
                descricaoEncerramento, anonima, sigilosa, latitude, longitude);
    }

    private void inserirProcesso(UUID ocorrenciaId, String status) {
        jdbcTemplate.update("INSERT INTO " + SCHEMA + ".processo_sanitario"
                + " (protocolo, data_abertura, ocorrencia_id, status_processo, criado_por_id)"
                + " VALUES (?, DATE '2026-10-11', CAST(? AS uuid), ?, ?)",
                protocoloUnico(), ocorrenciaId, status, usuarioId);
    }

    private int proximoProtocolo(String entidade, int ano) {
        return jdbcTemplate.queryForObject("INSERT INTO " + SCHEMA + ".protocolo_sequencia AS s (entidade, ano, ultimo)"
                + " VALUES (?, ?, 1) ON CONFLICT (entidade, ano)"
                + " DO UPDATE SET ultimo = s.ultimo + 1 RETURNING ultimo",
                Integer.class, entidade, ano);
    }

    private List<String> codigos(String tabela) {
        return jdbcTemplate.queryForList("SELECT codigo FROM " + SCHEMA + "." + tabela, String.class);
    }

    private int contar(String tabela) {
        return jdbcTemplate.queryForObject("SELECT count(*) FROM " + SCHEMA + "." + tabela, Integer.class);
    }

    // Protocolo so precisa ser unico dentro do schema do teste (varchar(20)).
    private static String protocoloUnico() {
        return "T" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }
}
