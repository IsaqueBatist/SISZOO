package com.siszoo.animais.clinico.controller;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.comparesEqualTo;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.siszoo.animais.clinico.dto.CriarVacinacaoRequest;
import com.siszoo.animais.clinico.entity.Vacinacao;
import com.siszoo.animais.clinico.repository.VacinacaoRepository;
import com.siszoo.animais.dto.CriarAnimalRequest;
import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.usuarios.dto.LoginRequest;
import com.siszoo.usuarios.entity.AcaoAuditoria;
import com.siszoo.usuarios.entity.AuditoriaEvento;
import com.siszoo.usuarios.entity.Cargo;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.entity.UsuarioCargo;
import com.siszoo.usuarios.repository.AuditoriaEventoRepository;
import com.siszoo.usuarios.repository.CargoRepository;
import com.siszoo.usuarios.repository.UsuarioCargoRepository;
import com.siszoo.usuarios.repository.UsuarioRepository;

import io.restassured.http.ContentType;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.JsonNode;

class VacinacaoControllerIT extends AbstractIntegrationTest {

    private static final UUID CARGO_ADMINISTRADOR_ID = UUID.fromString("00000000-0000-4000-8000-000000000001");
    private static final UUID CARGO_AGENTE_SANITARIO_ID = UUID.fromString("00000000-0000-4000-8000-000000000003");
    private static final String EMAIL_ADMIN = "teste.admin.vacinacoes@itu.sp.gov.br";
    private static final String SENHA_ADMIN = "SenhaAdmin123";

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private CargoRepository cargoRepository;

    @Autowired
    private UsuarioCargoRepository usuarioCargoRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private VacinacaoRepository vacinacaoRepository;

    @Autowired
    private AuditoriaEventoRepository auditoriaEventoRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private String tokenAdmin;

    @BeforeEach
    void seedAdmin() {
        if (usuarioRepository.findByEmail(EMAIL_ADMIN).isEmpty()) {
            Usuario admin = new Usuario();
            admin.setEmail(EMAIL_ADMIN);
            admin.setSenha(passwordEncoder.encode(SENHA_ADMIN));
            admin.setNome("Admin");
            admin.setSobrenome("Vacinacoes");
            usuarioRepository.save(admin);

            Cargo cargoAdministrador = cargoRepository.findById(CARGO_ADMINISTRADOR_ID).orElseThrow();
            UsuarioCargo vinculo = new UsuarioCargo();
            vinculo.setUsuario(admin);
            vinculo.setCargo(cargoAdministrador);
            usuarioCargoRepository.save(vinculo);
        }

        tokenAdmin = login(EMAIL_ADMIN, SENHA_ADMIN);
    }

    @Test
    void deveCriarVacinacaoComSucesso() {
        String animalId = criarAnimalViaApi();

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(new CriarVacinacaoRequest(
                        UUID.fromString(animalId), "antirrabica", LocalDate.now(), 1,
                        new BigDecimal("1.000"), null, "LOTE-1", "Sem intercorrencias", null))
                .when()
                .post("/api/vacinacoes")
                .then()
                .statusCode(200)
                .body("vacinaCodigo", equalTo("antirrabica"))
                .body("vacinaNome", equalTo("Antirrábica"))
                .body("statusRegistro", equalTo("ATIVO"))
                .body("retificaId", nullValue())
                .body("retificadoPorId", nullValue());
    }

    @Test
    void deveRetornar422QuandoVacinaInvalida() {
        String animalId = criarAnimalViaApi();

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(new CriarVacinacaoRequest(
                        UUID.fromString(animalId), "vacina-inexistente", LocalDate.now(), 1,
                        new BigDecimal("1.000"), null, null, null, null))
                .when()
                .post("/api/vacinacoes")
                .then()
                .statusCode(422);
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
    void deveRetornar405ParaPutPatchEDelete() {
        String id = criarVacinacaoViaApi(criarAnimalViaApi(), null).path("id");

        given().header("Authorization", "Bearer " + tokenAdmin).when().put("/api/vacinacoes/" + id)
                .then().statusCode(405);
        given().header("Authorization", "Bearer " + tokenAdmin).when().patch("/api/vacinacoes/" + id)
                .then().statusCode(405);
        given().header("Authorization", "Bearer " + tokenAdmin).when().delete("/api/vacinacoes/" + id)
                .then().statusCode(405);
    }

    @Test
    void deveRetornar403QuandoAgenteSanitarioTentaCriarVacinacao() {
        String tokenAgente = criarUsuarioComCargoERetornarToken(
                "teste.agente.vacinacoes@itu.sp.gov.br", "SenhaAgente123", CARGO_AGENTE_SANITARIO_ID);
        String animalId = criarAnimalViaApi();

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAgente)
                .body(new CriarVacinacaoRequest(
                        UUID.fromString(animalId), "antirrabica", LocalDate.now(), 1,
                        new BigDecimal("1.000"), null, null, null, null))
                .when()
                .post("/api/vacinacoes")
                .then()
                .statusCode(403);
    }

    @Test
    void deveRetificarSemAlterarOriginalEGerarUmEventoDeAuditoria() {
        String animalId = criarAnimalViaApi();
        String idOriginal = criarVacinacaoViaApi(animalId, null).path("id");

        Vacinacao original = vacinacaoRepository.findById(UUID.fromString(idOriginal)).orElseThrow();
        BigDecimal doseOriginal = original.getDoseQuantidade();
        LocalDate dataAplicacaoOriginal = original.getDataAplicacao();
        LocalDateTime criadoEmOriginal = original.getCriadoEm();
        assertThat(original.getRetifica(), nullValue());

        String idCorrecao = given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(new CriarVacinacaoRequest(
                        UUID.fromString(animalId), "antirrabica", LocalDate.now(), 1,
                        new BigDecimal("2.000"), null, "LOTE-CORRIGIDO", "Dose corrigida",
                        UUID.fromString(idOriginal)))
                .when()
                .post("/api/vacinacoes")
                .then()
                .statusCode(200)
                .body("retificaId", equalTo(idOriginal))
                .body("doseQuantidade", equalTo(2.0f))
                .extract().response().path("id");

        assertThat(idCorrecao, org.hamcrest.Matchers.not(equalTo(idOriginal)));

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
    }

    @Test
    void deveRetornar422QuandoRetificaApontaParaRegistroDeOutroAnimal() {
        String idVacinacao = criarVacinacaoViaApi(criarAnimalViaApi(), null).path("id");
        String outroAnimalId = criarAnimalViaApi();

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(new CriarVacinacaoRequest(
                        UUID.fromString(outroAnimalId), "antirrabica", LocalDate.now(), 1,
                        new BigDecimal("1.000"), null, null, null, UUID.fromString(idVacinacao)))
                .when()
                .post("/api/vacinacoes")
                .then()
                .statusCode(422);
    }

    @Test
    void deveRetornar409QuandoRegistroJaFoiRetificado() {
        String animalId = criarAnimalViaApi();
        String idOriginal = criarVacinacaoViaApi(animalId, null).path("id");
        criarVacinacaoViaApi(animalId, idOriginal);

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(new CriarVacinacaoRequest(
                        UUID.fromString(animalId), "antirrabica", LocalDate.now(), 1,
                        new BigDecimal("3.000"), null, null, null, UUID.fromString(idOriginal)))
                .when()
                .post("/api/vacinacoes")
                .then()
                .statusCode(409);
    }

    private io.restassured.response.Response criarVacinacaoViaApi(String animalId, String retificaId) {
        return given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(new CriarVacinacaoRequest(
                        UUID.fromString(animalId), "antirrabica", LocalDate.now(), 1,
                        new BigDecimal("1.000"), null, "LOTE-1", null,
                        retificaId == null ? null : UUID.fromString(retificaId)))
                .when()
                .post("/api/vacinacoes")
                .then()
                .statusCode(200)
                .extract()
                .response();
    }

    private String criarAnimalViaApi() {
        CriarAnimalRequest request = new CriarAnimalRequest(
                "Animal Vacinacao", "canino", "macho", null, null, null, null, null, null, null,
                microchipUnico(), false, null, "disponivel_adocao", "resgate", LocalDateTime.now(),
                null, null, null);

        return given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(request)
                .when()
                .post("/api/animais")
                .then()
                .statusCode(200)
                .extract()
                .path("id");
    }

    private String microchipUnico() {
        return "MC" + UUID.randomUUID().toString().substring(0, 20);
    }

    private String criarUsuarioComCargoERetornarToken(String email, String senha, UUID cargoId) {
        if (usuarioRepository.findByEmail(email).isEmpty()) {
            Usuario usuario = new Usuario();
            usuario.setEmail(email);
            usuario.setSenha(passwordEncoder.encode(senha));
            usuario.setNome("Teste");
            usuario.setSobrenome("Vacinacoes");
            usuarioRepository.save(usuario);

            Cargo cargo = cargoRepository.findById(cargoId).orElseThrow();
            UsuarioCargo vinculo = new UsuarioCargo();
            vinculo.setUsuario(usuario);
            vinculo.setCargo(cargo);
            usuarioCargoRepository.save(vinculo);
        }
        return login(email, senha);
    }

    private String login(String email, String senha) {
        return given()
                .contentType(ContentType.JSON)
                .body(new LoginRequest(email, senha))
                .when()
                .post("/api/auth/login")
                .then()
                .statusCode(200)
                .extract()
                .path("token");
    }
}
