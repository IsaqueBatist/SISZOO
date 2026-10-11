package com.siszoo.animais.clinico.controller;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.comparesEqualTo;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.nullValue;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import javax.sql.DataSource;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;

import com.siszoo.animais.clinico.dto.CriarVacinacaoRequest;
import com.siszoo.animais.clinico.entity.UnidadeDose;
import com.siszoo.animais.clinico.entity.Vacinacao;
import com.siszoo.animais.clinico.repository.VacinaRepository;
import com.siszoo.animais.clinico.repository.VacinacaoRepository;
import com.siszoo.animais.repository.AnimalRepository;
import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;
import com.siszoo.comum.RelogioTesteConfig;
import com.siszoo.usuarios.entity.AcaoAuditoria;
import com.siszoo.usuarios.entity.AuditoriaEvento;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.repository.AuditoriaEventoRepository;

import io.restassured.http.ContentType;
import io.restassured.response.Response;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

// Relogio fixo (RelogioTesteConfig): RN-C06 compara dataAplicacao com
// LocalDate.now(clock) em Sao Paulo; LocalDate.now() da JVM (UTC na CI)
// viraria "amanha" a partir das 21:00 locais e quebraria os testes. A virada
// do dia em si e coberta por RegrasFusoHorarioIT.
@Import(RelogioTesteConfig.class)
class VacinacaoControllerIT extends AbstractIntegrationTest {

    private static final String EMAIL_ADMIN = "teste.admin.vacinacoes@itu.sp.gov.br";
    private static final LocalDate HOJE = RelogioTesteConfig.HOJE;

    @Autowired
    private ApiTesteFixture fixture;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private DataSource dataSource;

    @Autowired
    private AnimalRepository animalRepository;

    @Autowired
    private VacinaRepository vacinaRepository;

    @Autowired
    private VacinacaoRepository vacinacaoRepository;

    @Autowired
    private AuditoriaEventoRepository auditoriaEventoRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private String tokenAdmin;

    @BeforeEach
    void autenticarAdmin() {
        tokenAdmin = fixture.tokenAdmin(EMAIL_ADMIN, "Vacinacoes");
    }

    @Test
    void deveCriarVacinacaoComSucesso() {
        String animalId = fixture.criarAnimal(tokenAdmin);

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(new CriarVacinacaoRequest(
                        UUID.fromString(animalId), "antirrabica", HOJE, 1,
                        new BigDecimal("1.000"), UnidadeDose.MILILITRO, "LOTE-1", "Sem intercorrencias", null))
                .when()
                .post("/api/vacinacoes")
                .then()
                .statusCode(200)
                .body("vacinaCodigo", equalTo("antirrabica"))
                .body("vacinaNome", equalTo("Antirrábica"))
                .body("doseUnidade", equalTo("MILILITRO"))
                .body("statusRegistro", equalTo("ATIVO"))
                .body("retificaId", nullValue())
                .body("retificadoPorId", nullValue());
    }

    @Test
    void deveRetornar422QuandoVacinaInvalida() {
        String animalId = fixture.criarAnimal(tokenAdmin);

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(new CriarVacinacaoRequest(
                        UUID.fromString(animalId), "vacina-inexistente", HOJE, 1,
                        new BigDecimal("1.000"), UnidadeDose.MILILITRO, null, null, null))
                .when()
                .post("/api/vacinacoes")
                .then()
                .statusCode(422)
                .body("mensagem", equalTo("Vacina informada nao existe"));
    }

    @Test
    void deveRetornar404QuandoVacinacaoNaoExiste() {
        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when()
                .get("/api/vacinacoes/" + UUID.randomUUID())
                .then()
                .statusCode(404);
    }

    @Test
    @DisplayName("[RN-C01] PUT/PATCH/DELETE em vacinacao retornam 405")
    void deveRetornar405ParaPutPatchEDelete() {
        String id = fixture.criarVacinacao(tokenAdmin, fixture.criarAnimal(tokenAdmin), HOJE, null);

        given().header("Authorization", "Bearer " + tokenAdmin).when().put("/api/vacinacoes/" + id)
                .then().statusCode(405);
        given().header("Authorization", "Bearer " + tokenAdmin).when().patch("/api/vacinacoes/" + id)
                .then().statusCode(405);
        given().header("Authorization", "Bearer " + tokenAdmin).when().delete("/api/vacinacoes/" + id)
                .then().statusCode(405);
    }

    @Test
    void deveRetornar403QuandoAgenteSanitarioTentaCriarVacinacao() {
        String tokenAgente = fixture.tokenComCargo(
                "teste.agente.vacinacoes@itu.sp.gov.br", "Teste", "Vacinacoes",
                ApiTesteFixture.CARGO_AGENTE_SANITARIO_ID);
        String animalId = fixture.criarAnimal(tokenAdmin);

        fixture.postarVacinacao(tokenAgente, animalId, HOJE, UnidadeDose.MILILITRO, null)
                .then()
                .statusCode(403);
    }

    @Test
    @DisplayName("[RN-C02][RN-C03] retificacao preserva o original e gera ATUALIZACAO com antes/depois")
    void deveRetificarSemAlterarOriginalEGerarUmEventoDeAuditoria() {
        String animalId = fixture.criarAnimal(tokenAdmin);
        String idOriginal = fixture.criarVacinacao(tokenAdmin, animalId, HOJE, null);

        Vacinacao original = vacinacaoRepository.findById(UUID.fromString(idOriginal)).orElseThrow();
        BigDecimal doseOriginal = original.getDoseQuantidade();
        LocalDate dataAplicacaoOriginal = original.getDataAplicacao();
        LocalDateTime criadoEmOriginal = original.getCriadoEm();
        assertThat(original.getRetifica(), nullValue());

        String idCorrecao = given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(new CriarVacinacaoRequest(
                        UUID.fromString(animalId), "antirrabica", HOJE, 1,
                        new BigDecimal("2.000"), UnidadeDose.MILILITRO, "LOTE-CORRIGIDO", "Dose corrigida",
                        UUID.fromString(idOriginal)))
                .when()
                .post("/api/vacinacoes")
                .then()
                .statusCode(200)
                .body("retificaId", equalTo(idOriginal))
                .body("doseQuantidade", equalTo(2.0f))
                .extract().response().path("id");

        assertThat(idCorrecao, not(equalTo(idOriginal)));

        // A linha original nao pode ter sido alterada por UPDATE algum.
        Vacinacao originalReconsultada = vacinacaoRepository.findById(UUID.fromString(idOriginal)).orElseThrow();
        assertThat(originalReconsultada.getDoseQuantidade(), equalTo(doseOriginal));
        assertThat(originalReconsultada.getDataAplicacao(), equalTo(dataAplicacaoOriginal));
        assertThat(originalReconsultada.getCriadoEm(), equalTo(criadoEmOriginal));

        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when()
                .get("/api/vacinacoes/" + idOriginal)
                .then()
                .statusCode(200)
                .body("statusRegistro", equalTo("RETIFICADO"))
                .body("retificadoPorId", equalTo(idCorrecao));

        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when()
                .get("/api/vacinacoes/" + idCorrecao)
                .then()
                .statusCode(200)
                .body("statusRegistro", equalTo("ATIVO"))
                .body("retificadoPorId", nullValue());

        // O banco de testes e compartilhado entre metodos de teste (sem rollback
        // por teste), entao filtra pelo id da correcao especifica deste teste em
        // vez de assumir que e o unico evento ATUALIZACAO/vacinacao do banco.
        List<AuditoriaEvento> eventosDestaCorrecao = auditoriaEventoRepository.findAll().stream()
                .filter(e -> "vacinacao".equals(e.getEntidade()) && e.getAcao() == AcaoAuditoria.ATUALIZACAO)
                .filter(e -> idCorrecao.equals(objectMapper.readTree(e.getPayloadDepois()).get("id").asString()))
                .toList();
        assertThat(eventosDestaCorrecao, hasSize(1));

        AuditoriaEvento evento = eventosDestaCorrecao.get(0);
        JsonNode antes = objectMapper.readTree(evento.getPayloadAntes());
        JsonNode depois = objectMapper.readTree(evento.getPayloadDepois());
        // jsonb normaliza literais numericos (remove zeros a direita), entao a
        // comparacao e por valor (compareTo), nao pelo texto exato da string.
        assertThat(antes.get("doseQuantidade").decimalValue(), comparesEqualTo(new BigDecimal("1.000")));
        assertThat(depois.get("doseQuantidade").decimalValue(), comparesEqualTo(new BigDecimal("2.000")));
        assertThat(antes.get("id").asString(), equalTo(idOriginal));
        assertThat(depois.get("id").asString(), equalTo(idCorrecao));
        // entidade_id aponta para o NOVO registro (V2), o mesmo de payload_depois.
        assertThat(evento.getEntidadeId(), equalTo(UUID.fromString(idCorrecao)));
    }

    @Test
    @DisplayName("[Issue #2] criacao grava entidade_id = id da vacinacao criada")
    void deveGravarEntidadeIdNoEventoDeCriacao() {
        String idVacinacao = fixture.criarVacinacao(tokenAdmin, fixture.criarAnimal(tokenAdmin), HOJE, null);

        List<AuditoriaEvento> eventos = auditoriaEventoRepository.findAll().stream()
                .filter(e -> "vacinacao".equals(e.getEntidade()) && e.getAcao() == AcaoAuditoria.CRIACAO)
                .filter(e -> UUID.fromString(idVacinacao).equals(e.getEntidadeId()))
                .toList();
        assertThat(eventos, hasSize(1));
        assertThat(objectMapper.readTree(eventos.get(0).getPayloadDepois()).get("id").asString(), equalTo(idVacinacao));
    }

    @Test
    @DisplayName("[RN-C02] retificacao de registro de outro animal retorna 422")
    void deveRetornar422QuandoRetificaApontaParaRegistroDeOutroAnimal() {
        String idVacinacao = fixture.criarVacinacao(tokenAdmin, fixture.criarAnimal(tokenAdmin), HOJE, null);
        String outroAnimalId = fixture.criarAnimal(tokenAdmin);

        fixture.postarVacinacao(tokenAdmin, outroAnimalId, HOJE, UnidadeDose.MILILITRO, idVacinacao)
                .then()
                .statusCode(422)
                .body("mensagem", equalTo("Registro retificado pertence a outro animal"));
    }

    @Test
    @DisplayName("[RN-C02] registro ja retificado nao pode ser retificado de novo (409)")
    void deveRetornar409QuandoRegistroJaFoiRetificado() {
        String animalId = fixture.criarAnimal(tokenAdmin);
        String idOriginal = fixture.criarVacinacao(tokenAdmin, animalId, HOJE, null);
        fixture.criarVacinacao(tokenAdmin, animalId, HOJE, idOriginal);

        fixture.postarVacinacao(tokenAdmin, animalId, HOJE, UnidadeDose.MILILITRO, idOriginal)
                .then()
                .statusCode(409)
                .body("mensagem", equalTo("Registro ja foi retificado por outro"));
    }

    // Corrida real, sem mock: uma transacao paralela insere a retificacao e
    // segura o commit. A requisicao passa pela pre-checagem do service (nao
    // enxerga a linha nao commitada) e o INSERT dela fica preso no indice
    // unico de retifica_id; o commit da paralela a faz violar
    // uq_vacinacao_retifica_id, que o handler deve traduzir no mesmo 409 da
    // pre-checagem, e nao no 409 generico de integridade.
    @Test
    @DisplayName("[RN-C02] retificacao concorrente do mesmo registro responde 409 com mensagem especifica")
    void deveRetornar409ComMensagemEspecificaQuandoRetificacaoConcorrenteViolaUnicidade() throws Exception {
        String animalId = fixture.criarAnimal(tokenAdmin);
        String idOriginal = fixture.criarVacinacao(tokenAdmin, animalId, HOJE, null);

        try (Connection concorrente = dataSource.getConnection()) {
            concorrente.setAutoCommit(false);
            try (PreparedStatement insert = concorrente.prepareStatement("""
                    INSERT INTO vacinacao (animal_id, vacina_id, data_aplicacao, dose_quantidade, dose_unidade, retifica_id)
                    SELECT ?, id, ?, 1.000, 'MILILITRO', ? FROM vacina WHERE codigo = 'antirrabica'
                    """)) {
                insert.setObject(1, UUID.fromString(animalId));
                insert.setObject(2, HOJE);
                insert.setObject(3, UUID.fromString(idOriginal));
                insert.executeUpdate();
            }

            CompletableFuture<Response> requisicao = CompletableFuture.supplyAsync(() ->
                    fixture.postarVacinacao(tokenAdmin, animalId, HOJE, UnidadeDose.MILILITRO, idOriginal));

            aguardarInsertBloqueadoEmVacinacao(requisicao);
            concorrente.commit();

            requisicao.get(30, TimeUnit.SECONDS)
                    .then()
                    .statusCode(409)
                    .body("mensagem", equalTo("Registro ja foi retificado por outro"));
        }
    }

    private void aguardarInsertBloqueadoEmVacinacao(CompletableFuture<Response> requisicao) throws InterruptedException {
        long limite = System.nanoTime() + TimeUnit.SECONDS.toNanos(30);
        while (System.nanoTime() < limite) {
            if (requisicao.isDone()) {
                throw new AssertionError("A requisicao terminou sem esperar a transacao concorrente: "
                        + requisicao.join().asString());
            }
            Integer bloqueados = jdbcTemplate.queryForObject("""
                    SELECT count(*) FROM pg_stat_activity
                    WHERE wait_event_type = 'Lock' AND query ILIKE 'insert into vacinacao%'
                    """, Integer.class);
            if (bloqueados != null && bloqueados > 0) {
                return;
            }
            Thread.sleep(50);
        }
        throw new AssertionError("O INSERT da requisicao nao chegou a esperar o indice unico de retifica_id");
    }

    @Test
    @DisplayName("[RN-C06] dataAplicacao = hoje e aceita")
    void deveAceitarDataAplicacaoHoje() {
        fixture.postarVacinacao(tokenAdmin, fixture.criarAnimal(tokenAdmin), HOJE, UnidadeDose.MILILITRO, null)
                .then()
                .statusCode(200)
                .body("dataAplicacao", equalTo(HOJE.toString()));
    }

    @Test
    @DisplayName("[RN-C06] dataAplicacao = ontem e aceita")
    void deveAceitarDataAplicacaoOntem() {
        LocalDate ontem = HOJE.minusDays(1);

        fixture.postarVacinacao(tokenAdmin, fixture.criarAnimal(tokenAdmin), ontem, UnidadeDose.MILILITRO, null)
                .then()
                .statusCode(200)
                .body("dataAplicacao", equalTo(ontem.toString()));
    }

    @Test
    @DisplayName("[RN-C06] dataAplicacao = amanha retorna 422")
    void deveRetornar422QuandoDataAplicacaoFutura() {
        fixture.postarVacinacao(
                        tokenAdmin, fixture.criarAnimal(tokenAdmin), HOJE.plusDays(1), UnidadeDose.MILILITRO, null)
                .then()
                .statusCode(422)
                .body("mensagem", equalTo("Data de aplicacao nao pode ser futura"));
    }

    @Test
    @DisplayName("[RN-C06] retificacao com dataAplicacao = amanha retorna 422 e nao retifica o original")
    void deveRetornar422QuandoRetificacaoTemDataAplicacaoFutura() {
        String animalId = fixture.criarAnimal(tokenAdmin);
        String idOriginal = fixture.criarVacinacao(tokenAdmin, animalId, HOJE, null);

        fixture.postarVacinacao(tokenAdmin, animalId, HOJE.plusDays(1), UnidadeDose.MILILITRO, idOriginal)
                .then()
                .statusCode(422)
                .body("mensagem", equalTo("Data de aplicacao nao pode ser futura"));

        assertThat(vacinacaoRepository.existsByRetificaId(UUID.fromString(idOriginal)), equalTo(false));
    }

    // O mesmo POST com unidade e aceito (deveAceitarDataAplicacaoHoje): so a
    // ausencia de doseUnidade explica o 422, e `campos` aponta exatamente ela.
    @Test
    @DisplayName("[RN-C05] vacinacao sem doseUnidade retorna 422 apontando o campo doseUnidade")
    void deveRetornar422QuandoDoseUnidadeAusente() {
        fixture.postarVacinacao(tokenAdmin, fixture.criarAnimal(tokenAdmin), HOJE, null, null)
                .then()
                .statusCode(422)
                .body("mensagem", equalTo("Dados invalidos"))
                .body("campos.campo", contains("doseUnidade"));
    }

    // Sem @Transactional no metodo: cada chamada do JdbcTemplate roda em
    // autocommit na propria conexao, entao o erro de FK do DELETE nao deixa
    // uma transacao PostgreSQL abortada para as releituras seguintes.
    @Test
    @DisplayName("[RN-C04] autor referenciado por vacinacao nao pode ser excluido fisicamente")
    void naoDeveExcluirFisicamenteUsuarioAutorDeVacinacao() {
        Usuario autor = fixture.criarUsuarioSemCargo(
                "teste.autor." + UUID.randomUUID().toString().substring(0, 8) + "@itu.sp.gov.br",
                "Autor", "Vacinacao");

        // Autor so e referenciado por esta vacinacao (o animal e criado pelo
        // admin): a unica FK que pode barrar o DELETE e fk_vacinacao_usuario.
        Vacinacao vacinacao = new Vacinacao();
        vacinacao.setAnimal(animalRepository.findById(UUID.fromString(fixture.criarAnimal(tokenAdmin))).orElseThrow());
        vacinacao.setVacina(vacinaRepository.findByCodigo("antirrabica").orElseThrow());
        vacinacao.setAplicadoPor(autor);
        vacinacao.setDataAplicacao(HOJE);
        vacinacao.setDoseQuantidade(new BigDecimal("1.000"));
        vacinacao.setDoseUnidade(UnidadeDose.MILILITRO);
        vacinacaoRepository.save(vacinacao);

        DataIntegrityViolationException erro = assertThrows(DataIntegrityViolationException.class,
                () -> jdbcTemplate.update("DELETE FROM usuario WHERE id = ?", autor.getId()));
        assertThat(erro.getMessage(), containsString("fk_vacinacao_usuario"));

        UUID aplicadoPorId = jdbcTemplate.queryForObject(
                "SELECT aplicado_por_id FROM vacinacao WHERE id = ?", UUID.class, vacinacao.getId());
        assertThat(aplicadoPorId, equalTo(autor.getId()));
    }

    @Test
    @DisplayName("[RN-C04] FKs de autor dos tres registros clinicos sao ON DELETE RESTRICT")
    void fksDeAutorDosRegistrosClinicosDevemSerRestrict() {
        Map<String, String> tipoDeletePorConstraint = jdbcTemplate.queryForList("""
                SELECT conname, confdeltype::text AS confdeltype FROM pg_constraint
                WHERE conname IN ('fk_vacinacao_usuario', 'fk_procedimento_usuario', 'fk_prescricao_usuario')
                """).stream()
                .collect(Collectors.toMap(
                        linha -> (String) linha.get("conname"), linha -> (String) linha.get("confdeltype")));

        // 'r' = RESTRICT no catalogo do PostgreSQL (pg_constraint.confdeltype).
        assertThat(tipoDeletePorConstraint, equalTo(Map.of(
                "fk_vacinacao_usuario", "r",
                "fk_procedimento_usuario", "r",
                "fk_prescricao_usuario", "r")));
    }
}
