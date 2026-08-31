package com.siszoo.animais.controller;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.MatcherAssert.assertThat;

import java.time.LocalDateTime;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.siszoo.animais.dto.AtualizarBaiaRequest;
import com.siszoo.animais.dto.AtualizarStatusBaiaRequest;
import com.siszoo.animais.dto.CriarAnimalRequest;
import com.siszoo.animais.dto.CriarBaiaRequest;
import com.siszoo.animais.entity.Baia;
import com.siszoo.animais.repository.BaiaRepository;
import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.usuarios.dto.LoginRequest;
import com.siszoo.usuarios.entity.Cargo;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.entity.UsuarioCargo;
import com.siszoo.usuarios.repository.CargoRepository;
import com.siszoo.usuarios.repository.UsuarioCargoRepository;
import com.siszoo.usuarios.repository.UsuarioRepository;

import io.restassured.http.ContentType;

class BaiaControllerIT extends AbstractIntegrationTest {

    private static final UUID CARGO_ADMINISTRADOR_ID = UUID.fromString("00000000-0000-4000-8000-000000000001");
    private static final UUID CARGO_AGENTE_SANITARIO_ID = UUID.fromString("00000000-0000-4000-8000-000000000003");
    private static final String EMAIL_ADMIN = "teste.admin.baias@itu.sp.gov.br";
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
    private BaiaRepository baiaRepository;

    private String tokenAdmin;

    @BeforeEach
    void seedAdmin() {
        if (usuarioRepository.findByEmail(EMAIL_ADMIN).isEmpty()) {
            Usuario admin = new Usuario();
            admin.setEmail(EMAIL_ADMIN);
            admin.setSenha(passwordEncoder.encode(SENHA_ADMIN));
            admin.setNome("Admin");
            admin.setSobrenome("Baias");
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
    void deveCriarBaiaComSucesso() {
        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(new CriarBaiaRequest("Baia Criar 1", "interna", (short) 5, "Cães porte médio", null))
                .when()
                .post("/api/baias")
                .then()
                .statusCode(200)
                .body("nome", equalTo("Baia Criar 1"))
                .body("tipoBaiaNome", equalTo("Interna"))
                .body("capacidade", equalTo(5))
                .body("ativa", equalTo(true))
                .body("ocupacaoAtual", equalTo(0))
                .body("superlotada", equalTo(false));
    }

    @Test
    void deveRetornar422QuandoTipoBaiaInvalido() {
        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(new CriarBaiaRequest("Baia Tipo Invalido", "tipo-inexistente", (short) 5, null, null))
                .when()
                .post("/api/baias")
                .then()
                .statusCode(422);
    }

    @Test
    void deveRetornar404QuandoBaiaNaoExiste() {
        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when()
                .get("/api/baias/" + UUID.randomUUID())
                .then()
                .statusCode(404);
    }

    @Test
    void deveAtualizarBaia() {
        String id = criarBaiaViaApi(new CriarBaiaRequest("Baia Original", "interna", (short) 5, null, null)).path("id");

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(new AtualizarBaiaRequest("Baia Renomeada", "gatil", (short) 8, "Filhotes", null))
                .when()
                .put("/api/baias/" + id)
                .then()
                .statusCode(200)
                .body("nome", equalTo("Baia Renomeada"))
                .body("tipoBaiaNome", equalTo("Gatil"))
                .body("capacidade", equalTo(8));

        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when()
                .get("/api/baias/" + id)
                .then()
                .statusCode(200)
                .body("nome", equalTo("Baia Renomeada"));
    }

    @Test
    void deveDesativarBaiaViaDeleteEReativarViaPatchStatus() {
        String id = criarBaiaViaApi(new CriarBaiaRequest("Baia Delete", "interna", (short) 5, null, null)).path("id");

        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when()
                .delete("/api/baias/" + id)
                .then()
                .statusCode(200)
                .body("ativa", equalTo(false));

        Baia baiaDesativada = baiaRepository.findById(UUID.fromString(id)).orElseThrow();
        assertThat(baiaDesativada.isAtiva(), equalTo(false));

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(new AtualizarStatusBaiaRequest(true))
                .when()
                .patch("/api/baias/" + id + "/status")
                .then()
                .statusCode(200)
                .body("ativa", equalTo(true));

        Baia baiaReativada = baiaRepository.findById(UUID.fromString(id)).orElseThrow();
        assertThat(baiaReativada.isAtiva(), equalTo(true));
    }

    @Test
    void deveRetornar403QuandoAgenteSanitarioTentaExcluirBaia() {
        String tokenAgente = criarUsuarioComCargoERetornarToken(
                "teste.agente.baias@itu.sp.gov.br", "SenhaAgente123", CARGO_AGENTE_SANITARIO_ID);
        String id = criarBaiaViaApi(new CriarBaiaRequest("Baia Protegida", "interna", (short) 5, null, null)).path("id");

        given()
                .header("Authorization", "Bearer " + tokenAgente)
                .when()
                .delete("/api/baias/" + id)
                .then()
                .statusCode(403);
    }

    @Test
    void deveFiltrarListagemPorAtiva() {
        String idAtiva = criarBaiaViaApi(new CriarBaiaRequest("Baia Ativa Filtro", "interna", (short) 5, null, null)).path("id");
        String idInativa = criarBaiaViaApi(new CriarBaiaRequest("Baia Inativa Filtro", "interna", (short) 5, null, null)).path("id");

        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when()
                .delete("/api/baias/" + idInativa)
                .then()
                .statusCode(200);

        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .queryParam("ativa", false)
                .queryParam("tamanho", 100)
                .when()
                .get("/api/baias")
                .then()
                .statusCode(200)
                .body("itens.id", hasItem(idInativa))
                .body("itens.id", not(hasItem(idAtiva)));
    }

    @Test
    void deveCalcularOcupacaoAbaixoDaCapacidade() {
        String id = criarBaiaViaApi(new CriarBaiaRequest("Baia Ocupacao Abaixo", "interna", (short) 5, null, null)).path("id");
        criarAnimalNaBaia(id, "disponivel_adocao");
        criarAnimalNaBaia(id, "disponivel_adocao");

        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when()
                .get("/api/baias/" + id)
                .then()
                .statusCode(200)
                .body("ocupacaoAtual", equalTo(2))
                .body("superlotada", equalTo(false));
    }

    @Test
    void deveCalcularOcupacaoIgualACapacidadeComoSuperlotada() {
        String id = criarBaiaViaApi(new CriarBaiaRequest("Baia Ocupacao Igual", "interna", (short) 2, null, null)).path("id");
        criarAnimalNaBaia(id, "disponivel_adocao");
        criarAnimalNaBaia(id, "disponivel_adocao");

        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when()
                .get("/api/baias/" + id)
                .then()
                .statusCode(200)
                .body("ocupacaoAtual", equalTo(2))
                .body("superlotada", equalTo(true));
    }

    @Test
    void devePersistirAtualizacaoSemRollbackQuandoOcupacaoAcimaDaCapacidade() {
        String id = criarBaiaViaApi(new CriarBaiaRequest("Baia Ocupacao Acima", "interna", (short) 2, null, null)).path("id");
        criarAnimalNaBaia(id, "disponivel_adocao");
        criarAnimalNaBaia(id, "disponivel_adocao");
        criarAnimalNaBaia(id, "disponivel_adocao");

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(new AtualizarBaiaRequest("Baia Ocupacao Acima Editada", "interna", (short) 2, "Superlotada de proposito", null))
                .when()
                .put("/api/baias/" + id)
                .then()
                .statusCode(200)
                .body("nome", equalTo("Baia Ocupacao Acima Editada"))
                .body("ocupacaoAtual", equalTo(3))
                .body("superlotada", equalTo(true));

        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when()
                .get("/api/baias/" + id)
                .then()
                .statusCode(200)
                .body("nome", equalTo("Baia Ocupacao Acima Editada"));
    }

    @Test
    void naoDeveContarAnimaisComStatusForaDaOcupacao() {
        String id = criarBaiaViaApi(new CriarBaiaRequest("Baia Status Excluidos", "interna", (short) 10, null, null)).path("id");
        criarAnimalNaBaia(id, "disponivel_adocao");
        criarAnimalNaBaia(id, "adotado");
        criarAnimalNaBaia(id, "obito_natural");
        criarAnimalNaBaia(id, "obito_eutanasia");
        criarAnimalNaBaia(id, "transferido");

        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when()
                .get("/api/baias/" + id)
                .then()
                .statusCode(200)
                .body("ocupacaoAtual", equalTo(1))
                .body("superlotada", equalTo(false));
    }

    private io.restassured.response.Response criarBaiaViaApi(CriarBaiaRequest request) {
        return given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(request)
                .when()
                .post("/api/baias")
                .then()
                .statusCode(200)
                .extract()
                .response();
    }

    private void criarAnimalNaBaia(String baiaId, String statusCodigo) {
        CriarAnimalRequest request = new CriarAnimalRequest(
                "Animal Teste", "canino", "macho", null, null, null, null, null, null, null,
                microchipUnico(), false, null, statusCodigo, "resgate", LocalDateTime.now(),
                UUID.fromString(baiaId), null, null);

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(request)
                .when()
                .post("/api/animais")
                .then()
                .statusCode(200);
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
            usuario.setSobrenome("Baias");
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
