package com.siszoo.animais.clinico.controller;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
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

import com.siszoo.animais.clinico.dto.CriarPrescricaoRequest;
import com.siszoo.animais.clinico.entity.CategoriaFarmacologica;
import com.siszoo.animais.clinico.entity.Medicamento;
import com.siszoo.animais.clinico.entity.Prescricao;
import com.siszoo.animais.clinico.entity.StatusPrescricao;
import com.siszoo.animais.clinico.entity.UnidadeDose;
import com.siszoo.animais.clinico.entity.UnidadeFrequencia;
import com.siszoo.animais.clinico.entity.ViaAdministracao;
import com.siszoo.animais.clinico.repository.CategoriaFarmacologicaRepository;
import com.siszoo.animais.clinico.repository.MedicamentoRepository;
import com.siszoo.animais.clinico.repository.PrescricaoRepository;
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

class PrescricaoControllerIT extends AbstractIntegrationTest {

    private static final UUID CARGO_ADMINISTRADOR_ID = UUID.fromString("00000000-0000-4000-8000-000000000001");
    private static final UUID CARGO_AGENTE_SANITARIO_ID = UUID.fromString("00000000-0000-4000-8000-000000000003");
    private static final String EMAIL_ADMIN = "teste.admin.prescricoes@itu.sp.gov.br";
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
    private PrescricaoRepository prescricaoRepository;

    @Autowired
    private MedicamentoRepository medicamentoRepository;

    @Autowired
    private CategoriaFarmacologicaRepository categoriaFarmacologicaRepository;

    @Autowired
    private AuditoriaEventoRepository auditoriaEventoRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private String tokenAdmin;
    private String medicamentoId;

    @BeforeEach
    void seedAdmin() {
        if (usuarioRepository.findByEmail(EMAIL_ADMIN).isEmpty()) {
            Usuario admin = new Usuario();
            admin.setEmail(EMAIL_ADMIN);
            admin.setSenha(passwordEncoder.encode(SENHA_ADMIN));
            admin.setNome("Admin");
            admin.setSobrenome("Prescricoes");
            usuarioRepository.save(admin);

            Cargo cargoAdministrador = cargoRepository.findById(CARGO_ADMINISTRADOR_ID).orElseThrow();
            UsuarioCargo vinculo = new UsuarioCargo();
            vinculo.setUsuario(admin);
            vinculo.setCargo(cargoAdministrador);
            usuarioCargoRepository.save(vinculo);
        }

        tokenAdmin = login(EMAIL_ADMIN, SENHA_ADMIN);
        medicamentoId = criarMedicamento().toString();
    }

    @Test
    void deveCriarPrescricaoComSucesso() {
        String animalId = criarAnimalViaApi();

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(requestBase(animalId, null))
                .when()
                .post("/api/prescricoes")
                .then()
                .statusCode(200)
                .body("statusRegistro", equalTo("ATIVO"))
                .body("status", equalTo("ATIVA"));
    }

    @Test
    void deveRetornar422QuandoMedicamentoInvalido() {
        String animalId = criarAnimalViaApi();

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(new CriarPrescricaoRequest(
                        UUID.fromString(animalId), UUID.randomUUID(), LocalDate.now(), null, null, 8,
                        UnidadeFrequencia.HORAS, new BigDecimal("10.000"), UnidadeDose.MILIGRAMA,
                        ViaAdministracao.ORAL, StatusPrescricao.ATIVA, null))
                .when()
                .post("/api/prescricoes")
                .then()
                .statusCode(422);
    }

    @Test
    void deveRetornar404QuandoPrescricaoNaoExiste() {
        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when()
                .get("/api/prescricoes/" + UUID.randomUUID())
                .then()
                .statusCode(404);
    }

    @Test
    void deveRetornar405ParaPutPatchEDelete() {
        String id = criarPrescricaoViaApi(criarAnimalViaApi(), null).path("id");

        given().header("Authorization", "Bearer " + tokenAdmin).when().put("/api/prescricoes/" + id)
                .then().statusCode(405);
        given().header("Authorization", "Bearer " + tokenAdmin).when().patch("/api/prescricoes/" + id)
                .then().statusCode(405);
        given().header("Authorization", "Bearer " + tokenAdmin).when().delete("/api/prescricoes/" + id)
                .then().statusCode(405);
    }

    @Test
    void deveRetornar403QuandoAgenteSanitarioTentaCriarPrescricao() {
        String tokenAgente = criarUsuarioComCargoERetornarToken(
                "teste.agente.prescricoes@itu.sp.gov.br", "SenhaAgente123", CARGO_AGENTE_SANITARIO_ID);
        String animalId = criarAnimalViaApi();

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAgente)
                .body(requestBase(animalId, null))
                .when()
                .post("/api/prescricoes")
                .then()
                .statusCode(403);
    }

    @Test
    void deveRetificarParaEncerrarPrescricaoSemAlterarOriginalEGerarUmEventoDeAuditoria() {
        String animalId = criarAnimalViaApi();
        String idOriginal = criarPrescricaoViaApi(animalId, null).path("id");

        Prescricao original = prescricaoRepository.findById(UUID.fromString(idOriginal)).orElseThrow();
        StatusPrescricao statusOriginal = original.getStatus();
        LocalDateTime criadoEmOriginal = original.getCriadoEm();

        CriarPrescricaoRequest encerramento = new CriarPrescricaoRequest(
                UUID.fromString(animalId), UUID.fromString(medicamentoId), LocalDate.now(), null, LocalDate.now(),
                8, UnidadeFrequencia.HORAS, new BigDecimal("10.000"), UnidadeDose.MILIGRAMA,
                ViaAdministracao.ORAL, StatusPrescricao.CONCLUIDA, UUID.fromString(idOriginal));

        String idCorrecao = given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(encerramento)
                .when()
                .post("/api/prescricoes")
                .then()
                .statusCode(200)
                .body("retificaId", equalTo(idOriginal))
                .body("status", equalTo("CONCLUIDA"))
                .extract().response().path("id");

        assertThat(idCorrecao, not(equalTo(idOriginal)));

        Prescricao originalReconsultada = prescricaoRepository.findById(UUID.fromString(idOriginal)).orElseThrow();
        assertThat(originalReconsultada.getStatus(), equalTo(statusOriginal));
        assertThat(originalReconsultada.getCriadoEm(), equalTo(criadoEmOriginal));

        given().header("Authorization", "Bearer " + tokenAdmin).when().get("/api/prescricoes/" + idOriginal)
                .then().statusCode(200).body("statusRegistro", equalTo("RETIFICADO")).body("retificadoPorId", equalTo(idCorrecao));

        given().header("Authorization", "Bearer " + tokenAdmin).when().get("/api/prescricoes/" + idCorrecao)
                .then().statusCode(200).body("statusRegistro", equalTo("ATIVO")).body("retificadoPorId", nullValue());

        // Banco de testes compartilhado entre metodos (sem rollback por teste):
        // filtra pelo id da correcao especifica, nao pelo total de eventos do banco.
        List<AuditoriaEvento> eventosDestaCorrecao = auditoriaEventoRepository.findAll().stream()
                .filter(e -> "prescricao".equals(e.getEntidade()) && e.getAcao() == AcaoAuditoria.ATUALIZACAO)
                .filter(e -> idCorrecao.equals(objectMapper.readTree(e.getPayloadDepois()).get("id").asString()))
                .toList();
        assertThat(eventosDestaCorrecao, hasSize(1));
    }

    @Test
    void deveRetornar409QuandoRegistroJaFoiRetificado() {
        String animalId = criarAnimalViaApi();
        String idOriginal = criarPrescricaoViaApi(animalId, null).path("id");
        criarPrescricaoViaApi(animalId, idOriginal);

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(requestBase(animalId, idOriginal))
                .when()
                .post("/api/prescricoes")
                .then()
                .statusCode(409);
    }

    private CriarPrescricaoRequest requestBase(String animalId, String retificaId) {
        return new CriarPrescricaoRequest(
                UUID.fromString(animalId), UUID.fromString(medicamentoId), LocalDate.now(), null, null, 8,
                UnidadeFrequencia.HORAS, new BigDecimal("10.000"), UnidadeDose.MILIGRAMA,
                ViaAdministracao.ORAL, StatusPrescricao.ATIVA,
                retificaId == null ? null : UUID.fromString(retificaId));
    }

    private io.restassured.response.Response criarPrescricaoViaApi(String animalId, String retificaId) {
        return given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(requestBase(animalId, retificaId))
                .when()
                .post("/api/prescricoes")
                .then()
                .statusCode(200)
                .extract()
                .response();
    }

    private UUID criarMedicamento() {
        CategoriaFarmacologica categoria = new CategoriaFarmacologica();
        categoria.setNome("Antibiotico Teste " + UUID.randomUUID());
        categoriaFarmacologicaRepository.save(categoria);

        Medicamento medicamento = new Medicamento();
        medicamento.setNome("Amoxicilina Teste");
        medicamento.setCategoria(categoria);
        return medicamentoRepository.save(medicamento).getId();
    }

    private String criarAnimalViaApi() {
        CriarAnimalRequest request = new CriarAnimalRequest(
                "Animal Prescricao", "canino", "macho", null, null, null, null, null, null, null,
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
            usuario.setSobrenome("Prescricoes");
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
