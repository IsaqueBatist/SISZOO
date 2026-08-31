package com.siszoo.animais.clinico.controller;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.nullValue;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.siszoo.animais.clinico.dto.CriarProcedimentoRequest;
import com.siszoo.animais.clinico.entity.Procedimento;
import com.siszoo.animais.clinico.repository.ProcedimentoRepository;
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

class ProcedimentoControllerIT extends AbstractIntegrationTest {

    private static final UUID CARGO_ADMINISTRADOR_ID = UUID.fromString("00000000-0000-4000-8000-000000000001");
    private static final UUID CARGO_AGENTE_SANITARIO_ID = UUID.fromString("00000000-0000-4000-8000-000000000003");
    private static final String EMAIL_ADMIN = "teste.admin.procedimentos@itu.sp.gov.br";
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
    private ProcedimentoRepository procedimentoRepository;

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
            admin.setSobrenome("Procedimentos");
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
    void deveCriarProcedimentoComSucesso() {
        String animalId = criarAnimalViaApi();

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(new CriarProcedimentoRequest(
                        UUID.fromString(animalId), "castracao", LocalDate.now(), "Castracao de rotina",
                        "Sem intercorrencia", null))
                .when()
                .post("/api/procedimentos")
                .then()
                .statusCode(200)
                .body("tipoProcedimentoCodigo", equalTo("castracao"))
                .body("statusRegistro", equalTo("ATIVO"));
    }

    @Test
    void deveRetornar422QuandoTipoProcedimentoInvalido() {
        String animalId = criarAnimalViaApi();

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(new CriarProcedimentoRequest(
                        UUID.fromString(animalId), "tipo-inexistente", LocalDate.now(), null, null, null))
                .when()
                .post("/api/procedimentos")
                .then()
                .statusCode(422);
    }

    @Test
    void deveRetornar404QuandoProcedimentoNaoExiste() {
        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when()
                .get("/api/procedimentos/" + UUID.randomUUID())
                .then()
                .statusCode(404);
    }

    @Test
    void deveRetornar405ParaPutPatchEDelete() {
        String id = criarProcedimentoViaApi(criarAnimalViaApi(), null).path("id");

        given().header("Authorization", "Bearer " + tokenAdmin).when().put("/api/procedimentos/" + id)
                .then().statusCode(405);
        given().header("Authorization", "Bearer " + tokenAdmin).when().patch("/api/procedimentos/" + id)
                .then().statusCode(405);
        given().header("Authorization", "Bearer " + tokenAdmin).when().delete("/api/procedimentos/" + id)
                .then().statusCode(405);
    }

    @Test
    void deveRetornar403QuandoAgenteSanitarioTentaCriarProcedimento() {
        String tokenAgente = criarUsuarioComCargoERetornarToken(
                "teste.agente.procedimentos@itu.sp.gov.br", "SenhaAgente123", CARGO_AGENTE_SANITARIO_ID);
        String animalId = criarAnimalViaApi();

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAgente)
                .body(new CriarProcedimentoRequest(UUID.fromString(animalId), "castracao", LocalDate.now(), null, null, null))
                .when()
                .post("/api/procedimentos")
                .then()
                .statusCode(403);
    }

    @Test
    void deveRetificarSemAlterarOriginalEGerarUmEventoDeAuditoria() {
        String animalId = criarAnimalViaApi();
        String idOriginal = criarProcedimentoViaApi(animalId, null).path("id");

        Procedimento original = procedimentoRepository.findById(UUID.fromString(idOriginal)).orElseThrow();
        String descricaoOriginal = original.getDescricao();
        LocalDateTime criadoEmOriginal = original.getCriadoEm();

        String idCorrecao = given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(new CriarProcedimentoRequest(
                        UUID.fromString(animalId), "castracao", LocalDate.now(), "Descricao corrigida",
                        "Resultado corrigido", UUID.fromString(idOriginal)))
                .when()
                .post("/api/procedimentos")
                .then()
                .statusCode(200)
                .body("retificaId", equalTo(idOriginal))
                .extract().response().path("id");

        assertThat(idCorrecao, not(equalTo(idOriginal)));

        Procedimento originalReconsultado = procedimentoRepository.findById(UUID.fromString(idOriginal)).orElseThrow();
        assertThat(originalReconsultado.getDescricao(), equalTo(descricaoOriginal));
        assertThat(originalReconsultado.getCriadoEm(), equalTo(criadoEmOriginal));

        given().header("Authorization", "Bearer " + tokenAdmin).when().get("/api/procedimentos/" + idOriginal)
                .then().statusCode(200).body("statusRegistro", equalTo("RETIFICADO")).body("retificadoPorId", equalTo(idCorrecao));

        given().header("Authorization", "Bearer " + tokenAdmin).when().get("/api/procedimentos/" + idCorrecao)
                .then().statusCode(200).body("statusRegistro", equalTo("ATIVO")).body("retificadoPorId", nullValue());

        // Banco de testes compartilhado entre metodos (sem rollback por teste):
        // filtra pelo id da correcao especifica, nao pelo total de eventos do banco.
        List<AuditoriaEvento> eventosDestaCorrecao = auditoriaEventoRepository.findAll().stream()
                .filter(e -> "procedimento".equals(e.getEntidade()) && e.getAcao() == AcaoAuditoria.ATUALIZACAO)
                .filter(e -> idCorrecao.equals(objectMapper.readTree(e.getPayloadDepois()).get("id").asString()))
                .toList();
        assertThat(eventosDestaCorrecao, hasSize(1));
    }

    @Test
    void deveRetornar409QuandoRegistroJaFoiRetificado() {
        String animalId = criarAnimalViaApi();
        String idOriginal = criarProcedimentoViaApi(animalId, null).path("id");
        criarProcedimentoViaApi(animalId, idOriginal);

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(new CriarProcedimentoRequest(
                        UUID.fromString(animalId), "castracao", LocalDate.now(), null, null, UUID.fromString(idOriginal)))
                .when()
                .post("/api/procedimentos")
                .then()
                .statusCode(409);
    }

    private io.restassured.response.Response criarProcedimentoViaApi(String animalId, String retificaId) {
        return given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(new CriarProcedimentoRequest(
                        UUID.fromString(animalId), "castracao", LocalDate.now(), "Descricao original", "Resultado original",
                        retificaId == null ? null : UUID.fromString(retificaId)))
                .when()
                .post("/api/procedimentos")
                .then()
                .statusCode(200)
                .extract()
                .response();
    }

    private String criarAnimalViaApi() {
        CriarAnimalRequest request = new CriarAnimalRequest(
                "Animal Procedimento", "canino", "macho", null, null, null, null, null, null, null,
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
            usuario.setSobrenome("Procedimentos");
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
