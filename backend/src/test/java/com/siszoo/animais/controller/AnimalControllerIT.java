package com.siszoo.animais.controller;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.nullValue;

import java.time.LocalDateTime;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.siszoo.animais.dto.AtualizarAnimalRequest;
import com.siszoo.animais.dto.CriarAnimalRequest;
import com.siszoo.animais.entity.Baia;
import com.siszoo.animais.repository.BaiaRepository;
import com.siszoo.animais.repository.TipoBaiaRepository;
import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.usuarios.dto.LoginRequest;
import com.siszoo.usuarios.entity.Cargo;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.entity.UsuarioCargo;
import com.siszoo.usuarios.repository.CargoRepository;
import com.siszoo.usuarios.repository.UsuarioCargoRepository;
import com.siszoo.usuarios.repository.UsuarioRepository;

import io.restassured.http.ContentType;

class AnimalControllerIT extends AbstractIntegrationTest {

    private static final UUID CARGO_ADMINISTRADOR_ID = UUID.fromString("00000000-0000-4000-8000-000000000001");
    private static final UUID CARGO_AGENTE_SANITARIO_ID = UUID.fromString("00000000-0000-4000-8000-000000000003");
    private static final String EMAIL_ADMIN = "teste.admin.animais@itu.sp.gov.br";
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

    @Autowired
    private TipoBaiaRepository tipoBaiaRepository;

    private String tokenAdmin;

    @BeforeEach
    void seedAdmin() {
        if (usuarioRepository.findByEmail(EMAIL_ADMIN).isEmpty()) {
            Usuario admin = new Usuario();
            admin.setEmail(EMAIL_ADMIN);
            admin.setSenha(passwordEncoder.encode(SENHA_ADMIN));
            admin.setNome("Admin");
            admin.setSobrenome("Animais");
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
    void deveCriarAnimalComMicrochipUnicoERotulosDeCatalogo() {
        Baia baia = criarBaia("Baia AnimalControllerIT 1");
        CriarAnimalRequest request = new CriarAnimalRequest(
                "Rex", "canino", "macho", "SRD", "Preto", "curta", "medio", null, "2 anos", null,
                microchipUnico(), false, null, "disponivel_adocao", "resgate", LocalDateTime.now(),
                baia.getId(), null, null);

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(request)
                .when()
                .post("/api/animais")
                .then()
                .statusCode(200)
                .body("especieNome", equalTo("Canino"))
                .body("statusNome", equalTo("Disponível"))
                .body("motivoEntradaNome", equalTo("Resgate"))
                .body("baiaNome", equalTo("Baia AnimalControllerIT 1"))
                .body("tipoBaiaNome", equalTo("Interna"))
                .body("fichaCompleta", equalTo(true));
    }

    @Test
    void deveCriarAnimalSemMicrochip() {
        CriarAnimalRequest request = animalMinimo(null);

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(request)
                .when()
                .post("/api/animais")
                .then()
                .statusCode(200)
                .body("microchip", nullValue())
                .body("fichaCompleta", equalTo(false));
    }

    @Test
    void deveRetornar409QuandoMicrochipDuplicado() {
        String microchip = microchipUnico();

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(animalMinimo(microchip))
                .when()
                .post("/api/animais")
                .then()
                .statusCode(200);

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(animalMinimo(microchip))
                .when()
                .post("/api/animais")
                .then()
                .statusCode(409);
    }

    @Test
    void deveRetornar422QuandoEspecieInvalida() {
        CriarAnimalRequest request = new CriarAnimalRequest(
                "Rex", "especie-inexistente", "macho", null, null, null, null, null, null, null,
                null, false, null, "disponivel_adocao", "resgate", LocalDateTime.now(), null, null, null);

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(request)
                .when()
                .post("/api/animais")
                .then()
                .statusCode(422);
    }

    @Test
    void deveRetornar422QuandoStatusInvalido() {
        CriarAnimalRequest request = new CriarAnimalRequest(
                "Rex", "canino", "macho", null, null, null, null, null, null, null,
                null, false, null, "status-inexistente", "resgate", LocalDateTime.now(), null, null, null);

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(request)
                .when()
                .post("/api/animais")
                .then()
                .statusCode(422);
    }

    @Test
    void deveRetornar422QuandoMotivoEntradaInvalido() {
        CriarAnimalRequest request = new CriarAnimalRequest(
                "Rex", "canino", "macho", null, null, null, null, null, null, null,
                null, false, null, "disponivel_adocao", "motivo-inexistente", LocalDateTime.now(), null, null, null);

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(request)
                .when()
                .post("/api/animais")
                .then()
                .statusCode(422);
    }

    @Test
    void deveRetornar422QuandoBaiaInvalida() {
        CriarAnimalRequest request = new CriarAnimalRequest(
                "Rex", "canino", "macho", null, null, null, null, null, null, null,
                null, false, null, "disponivel_adocao", "resgate", LocalDateTime.now(), UUID.randomUUID(), null, null);

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(request)
                .when()
                .post("/api/animais")
                .then()
                .statusCode(422);
    }

    @Test
    void deveListarComFiltroStatusEEspecie() {
        criarAnimalViaApi(new CriarAnimalRequest(
                "Mimi", "felino", "femea", null, null, null, null, null, null, null,
                microchipUnico(), false, null, "em_quarentena", "abandono", LocalDateTime.now(), null, null, null));
        criarAnimalViaApi(new CriarAnimalRequest(
                "Rex", "canino", "macho", null, null, null, null, null, null, null,
                microchipUnico(), false, null, "disponivel_adocao", "resgate", LocalDateTime.now(), null, null, null));

        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .queryParam("status", "em_quarentena")
                .queryParam("especie", "felino")
                .queryParam("pagina", 0)
                .queryParam("tamanho", 20)
                .when()
                .get("/api/animais")
                .then()
                .statusCode(200)
                .body("itens.size()", greaterThanOrEqualTo(1))
                .body("itens.statusCodigo", not(hasItem("disponivel_adocao")))
                .body("itens.especieCodigo", not(hasItem("canino")))
                .body("pagina", equalTo(0))
                .body("tamanho", equalTo(20));
    }

    @Test
    void deveRetornar404QuandoAnimalNaoExiste() {
        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when()
                .get("/api/animais/" + UUID.randomUUID())
                .then()
                .statusCode(404);
    }

    @Test
    void deveAtualizarAnimal() {
        String id = criarAnimalViaApi(animalMinimo(null)).path("id");

        AtualizarAnimalRequest atualizacao = new AtualizarAnimalRequest(
                "Rex Atualizado", "canino", "macho", null, null, null, null, null, null, null,
                null, false, null, "em_tratamento", "resgate", LocalDateTime.now(), null, null, null);

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(atualizacao)
                .when()
                .put("/api/animais/" + id)
                .then()
                .statusCode(200)
                .body("nome", equalTo("Rex Atualizado"))
                .body("statusCodigo", equalTo("em_tratamento"));

        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when()
                .get("/api/animais/" + id)
                .then()
                .statusCode(200)
                .body("nome", equalTo("Rex Atualizado"));
    }

    @Test
    void deveRejeitarAlteracaoDeMicrochip() {
        String microchipOriginal = microchipUnico();
        String id = criarAnimalViaApi(animalMinimo(microchipOriginal)).path("id");

        AtualizarAnimalRequest atualizacao = new AtualizarAnimalRequest(
                "Rex", "canino", "macho", null, null, null, null, null, null, null,
                microchipUnico(), false, null, "disponivel_adocao", "resgate", LocalDateTime.now(), null, null, null);

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(atualizacao)
                .when()
                .put("/api/animais/" + id)
                .then()
                .statusCode(422);

        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when()
                .get("/api/animais/" + id)
                .then()
                .statusCode(200)
                .body("microchip", equalTo(microchipOriginal));
    }

    @Test
    void deveDefinirMicrochipQuandoAusente() {
        String id = criarAnimalViaApi(animalMinimo(null)).path("id");
        String novoMicrochip = microchipUnico();

        AtualizarAnimalRequest atualizacao = new AtualizarAnimalRequest(
                "Rex", "canino", "macho", null, null, null, null, null, null, null,
                novoMicrochip, false, null, "disponivel_adocao", "resgate", LocalDateTime.now(), null, null, null);

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(atualizacao)
                .when()
                .put("/api/animais/" + id)
                .then()
                .statusCode(200)
                .body("microchip", equalTo(novoMicrochip));

        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when()
                .get("/api/animais/" + id)
                .then()
                .statusCode(200)
                .body("microchip", equalTo(novoMicrochip));
    }

    @Test
    void deveRetornar403QuandoAgenteSanitarioTentaCriarE200QuandoLista() {
        String tokenAgente = criarUsuarioComCargoERetornarToken(
                "teste.agente.animais@itu.sp.gov.br", "SenhaAgente123", CARGO_AGENTE_SANITARIO_ID);

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAgente)
                .body(animalMinimo(null))
                .when()
                .post("/api/animais")
                .then()
                .statusCode(403);

        given()
                .header("Authorization", "Bearer " + tokenAgente)
                .when()
                .get("/api/animais")
                .then()
                .statusCode(200);
    }

    @Test
    void deveListarCatalogosSeedados() {
        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when()
                .get("/api/animais/catalogos")
                .then()
                .statusCode(200)
                .body("especies.size()", equalTo(4))
                .body("status.size()", equalTo(7))
                .body("motivosEntrada.size()", equalTo(5))
                .body("tiposBaia.size()", equalTo(3));
    }

    private CriarAnimalRequest animalMinimo(String microchip) {
        return new CriarAnimalRequest(
                "Rex", "canino", "macho", null, null, null, null, null, null, null,
                microchip, false, null, "disponivel_adocao", "resgate", LocalDateTime.now(), null, null, null);
    }

    private io.restassured.response.Response criarAnimalViaApi(CriarAnimalRequest request) {
        return given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(request)
                .when()
                .post("/api/animais")
                .then()
                .statusCode(200)
                .extract()
                .response();
    }

    private String microchipUnico() {
        return "MC" + UUID.randomUUID().toString().substring(0, 20);
    }

    private Baia criarBaia(String nome) {
        Baia baia = new Baia();
        baia.setNome(nome);
        baia.setTipoBaia(tipoBaiaRepository.findByCodigo("interna").orElseThrow());
        baia.setCapacidade((short) 5);
        return baiaRepository.save(baia);
    }

    private String criarUsuarioComCargoERetornarToken(String email, String senha, UUID cargoId) {
        if (usuarioRepository.findByEmail(email).isEmpty()) {
            Usuario usuario = new Usuario();
            usuario.setEmail(email);
            usuario.setSenha(passwordEncoder.encode(senha));
            usuario.setNome("Teste");
            usuario.setSobrenome("Perfil");
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
