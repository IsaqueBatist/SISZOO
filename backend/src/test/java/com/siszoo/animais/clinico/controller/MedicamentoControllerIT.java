package com.siszoo.animais.clinico.controller;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.siszoo.animais.clinico.dto.AtualizarMedicamentoRequest;
import com.siszoo.animais.clinico.dto.CriarMedicamentoRequest;
import com.siszoo.animais.clinico.entity.CategoriaFarmacologica;
import com.siszoo.animais.clinico.entity.Medicamento;
import com.siszoo.animais.clinico.repository.CategoriaFarmacologicaRepository;
import com.siszoo.animais.clinico.repository.MedicamentoRepository;
import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.usuarios.dto.LoginRequest;
import com.siszoo.usuarios.entity.Cargo;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.entity.UsuarioCargo;
import com.siszoo.usuarios.repository.CargoRepository;
import com.siszoo.usuarios.repository.UsuarioCargoRepository;
import com.siszoo.usuarios.repository.UsuarioRepository;

import io.restassured.http.ContentType;

class MedicamentoControllerIT extends AbstractIntegrationTest {

    private static final UUID CARGO_ADMINISTRADOR_ID = UUID.fromString("00000000-0000-4000-8000-000000000001");
    private static final UUID CARGO_AGENTE_SANITARIO_ID = UUID.fromString("00000000-0000-4000-8000-000000000003");
    private static final String EMAIL_ADMIN = "teste.admin.medicamentos@itu.sp.gov.br";
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
    private MedicamentoRepository medicamentoRepository;

    @Autowired
    private CategoriaFarmacologicaRepository categoriaFarmacologicaRepository;

    private String tokenAdmin;
    private String categoriaId;

    @BeforeEach
    void seedAdminECategoria() {
        if (usuarioRepository.findByEmail(EMAIL_ADMIN).isEmpty()) {
            Usuario admin = new Usuario();
            admin.setEmail(EMAIL_ADMIN);
            admin.setSenha(passwordEncoder.encode(SENHA_ADMIN));
            admin.setNome("Admin");
            admin.setSobrenome("Medicamentos");
            usuarioRepository.save(admin);

            Cargo cargoAdministrador = cargoRepository.findById(CARGO_ADMINISTRADOR_ID).orElseThrow();
            UsuarioCargo vinculo = new UsuarioCargo();
            vinculo.setUsuario(admin);
            vinculo.setCargo(cargoAdministrador);
            usuarioCargoRepository.save(vinculo);
        }

        tokenAdmin = login(EMAIL_ADMIN, SENHA_ADMIN);

        // Sem endpoint de catalogo para categoria_farmacologica (fora do escopo
        // desta tarefa): a categoria de apoio para os testes e criada direto via
        // repositorio, nome unico para nao esbarrar em uq_categoria_farmacologica_nome.
        CategoriaFarmacologica categoria = new CategoriaFarmacologica();
        categoria.setNome("Categoria Teste " + UUID.randomUUID());
        categoriaFarmacologicaRepository.save(categoria);
        categoriaId = categoria.getId().toString();
    }

    @Test
    void deveCriarMedicamentoComSucesso() {
        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(new CriarMedicamentoRequest("Amoxicilina", UUID.fromString(categoriaId)))
                .when()
                .post("/api/medicamentos")
                .then()
                .statusCode(200)
                .body("nome", equalTo("Amoxicilina"))
                .body("categoriaId", equalTo(categoriaId))
                .body("ativo", equalTo(true));
    }

    @Test
    void deveRetornar422QuandoCategoriaInvalida() {
        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(new CriarMedicamentoRequest("Medicamento Categoria Invalida", UUID.randomUUID()))
                .when()
                .post("/api/medicamentos")
                .then()
                .statusCode(422);
    }

    @Test
    void deveRetornar404QuandoMedicamentoNaoExiste() {
        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when()
                .get("/api/medicamentos/" + UUID.randomUUID())
                .then()
                .statusCode(404);
    }

    @Test
    void deveAtualizarMedicamento() {
        String id = criarMedicamentoViaApi("Medicamento Original").path("id");

        CategoriaFarmacologica outraCategoria = new CategoriaFarmacologica();
        outraCategoria.setNome("Outra Categoria " + UUID.randomUUID());
        categoriaFarmacologicaRepository.save(outraCategoria);

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(new AtualizarMedicamentoRequest("Medicamento Renomeado", outraCategoria.getId()))
                .when()
                .put("/api/medicamentos/" + id)
                .then()
                .statusCode(200)
                .body("nome", equalTo("Medicamento Renomeado"))
                .body("categoriaId", equalTo(outraCategoria.getId().toString()));

        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when()
                .get("/api/medicamentos/" + id)
                .then()
                .statusCode(200)
                .body("nome", equalTo("Medicamento Renomeado"));
    }

    @Test
    void deveDesativarMedicamentoViaDeleteSemRemoverFisicamente() {
        String id = criarMedicamentoViaApi("Medicamento Delete").path("id");

        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when()
                .delete("/api/medicamentos/" + id)
                .then()
                .statusCode(200)
                .body("ativo", equalTo(false));

        Medicamento medicamentoDesativado = medicamentoRepository.findById(UUID.fromString(id)).orElseThrow();
        assertThat(medicamentoDesativado.isAtivo(), equalTo(false));

        // Prova de soft-delete: o registro continua existindo e acessivel via GET,
        // so com ativo=false — nunca ha DELETE fisico na tabela.
        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when()
                .get("/api/medicamentos/" + id)
                .then()
                .statusCode(200)
                .body("ativo", equalTo(false));
    }

    @Test
    void deveRetornar403QuandoAgenteSanitarioTentaEscreverMedicamento() {
        String tokenAgente = criarUsuarioComCargoERetornarToken(
                "teste.agente.medicamentos@itu.sp.gov.br", "SenhaAgente123", CARGO_AGENTE_SANITARIO_ID);
        String id = criarMedicamentoViaApi("Medicamento Protegido").path("id");

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAgente)
                .body(new CriarMedicamentoRequest("Nao Deveria Criar", UUID.fromString(categoriaId)))
                .when()
                .post("/api/medicamentos")
                .then()
                .statusCode(403);

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAgente)
                .body(new AtualizarMedicamentoRequest("Nao Deveria Atualizar", UUID.fromString(categoriaId)))
                .when()
                .put("/api/medicamentos/" + id)
                .then()
                .statusCode(403);

        given()
                .header("Authorization", "Bearer " + tokenAgente)
                .when()
                .delete("/api/medicamentos/" + id)
                .then()
                .statusCode(403);
    }

    @Test
    void deveFiltrarListagemPorAtivoECategoria() {
        String idAtivo = criarMedicamentoViaApi("Medicamento Ativo Filtro").path("id");
        String idInativo = criarMedicamentoViaApi("Medicamento Inativo Filtro").path("id");

        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when()
                .delete("/api/medicamentos/" + idInativo)
                .then()
                .statusCode(200);

        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .queryParam("ativo", false)
                .queryParam("tamanho", 100)
                .when()
                .get("/api/medicamentos")
                .then()
                .statusCode(200)
                .body("itens.id", hasItem(idInativo))
                .body("itens.id", not(hasItem(idAtivo)));

        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .queryParam("categoriaId", categoriaId)
                .queryParam("tamanho", 100)
                .when()
                .get("/api/medicamentos")
                .then()
                .statusCode(200)
                .body("itens.id", hasItem(idAtivo));
    }

    private io.restassured.response.Response criarMedicamentoViaApi(String nome) {
        return given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(new CriarMedicamentoRequest(nome, UUID.fromString(categoriaId)))
                .when()
                .post("/api/medicamentos")
                .then()
                .statusCode(200)
                .extract()
                .response();
    }

    private String criarUsuarioComCargoERetornarToken(String email, String senha, UUID cargoId) {
        if (usuarioRepository.findByEmail(email).isEmpty()) {
            Usuario usuario = new Usuario();
            usuario.setEmail(email);
            usuario.setSenha(passwordEncoder.encode(senha));
            usuario.setNome("Teste");
            usuario.setSobrenome("Medicamentos");
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
