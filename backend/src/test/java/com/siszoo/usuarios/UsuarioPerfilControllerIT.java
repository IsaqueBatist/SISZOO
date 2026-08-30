package com.siszoo.usuarios;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.usuarios.dto.AtualizarPerfilRequest;
import com.siszoo.usuarios.dto.CriarUsuarioRequest;
import com.siszoo.usuarios.dto.LoginRequest;
import com.siszoo.usuarios.dto.PreferenciaUsuarioRequest;
import com.siszoo.usuarios.entity.Cargo;
import com.siszoo.usuarios.entity.DensidadeUsuario;
import com.siszoo.usuarios.entity.TemaUsuario;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.entity.UsuarioCargo;
import com.siszoo.usuarios.repository.CargoRepository;
import com.siszoo.usuarios.repository.UsuarioCargoRepository;
import com.siszoo.usuarios.repository.UsuarioRepository;

import io.restassured.http.ContentType;

class UsuarioPerfilControllerIT extends AbstractIntegrationTest {

    private static final UUID CARGO_ADMINISTRADOR_ID = UUID.fromString("00000000-0000-4000-8000-000000000001");
    private static final String EMAIL_ADMIN = "teste.admin.perfil@itu.sp.gov.br";
    private static final String SENHA_ADMIN = "SenhaAdmin123";
    private static final String EMAIL_USUARIO = "teste.perfil.usuario@itu.sp.gov.br";
    private static final String SENHA_INICIAL_USUARIO = "SenhaInicial123";

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private CargoRepository cargoRepository;

    @Autowired
    private UsuarioCargoRepository usuarioCargoRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String tokenAdmin;
    private String tokenUsuario;

    @BeforeEach
    void seedAdminECriarUsuario() {
        if (usuarioRepository.findByEmail(EMAIL_ADMIN).isEmpty()) {
            Usuario admin = new Usuario();
            admin.setEmail(EMAIL_ADMIN);
            admin.setSenha(passwordEncoder.encode(SENHA_ADMIN));
            admin.setNome("Admin");
            admin.setSobrenome("Perfil");
            usuarioRepository.save(admin);

            Cargo cargoAdministrador = cargoRepository.findById(CARGO_ADMINISTRADOR_ID).orElseThrow();
            UsuarioCargo vinculo = new UsuarioCargo();
            vinculo.setUsuario(admin);
            vinculo.setCargo(cargoAdministrador);
            usuarioCargoRepository.save(vinculo);
        }

        tokenAdmin = given()
                .contentType(ContentType.JSON)
                .body(new LoginRequest(EMAIL_ADMIN, SENHA_ADMIN))
                .when()
                .post("/api/auth/login")
                .then()
                .statusCode(200)
                .extract()
                .path("token");

        tokenUsuario = criarUsuarioEObterToken(EMAIL_USUARIO, SENHA_INICIAL_USUARIO);
    }

    // Cria (se ainda não existir) um usuário via Admin e retorna o token dele.
    // Cada teste que precisa de estado "intocado" (ex.: preferências default)
    // deve pedir seu próprio e-mail aqui, em vez de reaproveitar EMAIL_USUARIO —
    // o Postgres do Testcontainers é compartilhado por toda a classe de teste,
    // então mutações de um teste (ex.: trocar o tema) vazam para os outros.
    private String criarUsuarioEObterToken(String email, String senhaInicial) {
        if (usuarioRepository.findByEmail(email).isEmpty()) {
            CriarUsuarioRequest request = new CriarUsuarioRequest(
                    "Perfil", "Teste", email, "Agente Sanitário", null, null, senhaInicial);

            given()
                    .contentType(ContentType.JSON)
                    .header("Authorization", "Bearer " + tokenAdmin)
                    .body(request)
                    .when()
                    .post("/api/usuarios")
                    .then()
                    .statusCode(200);
        }

        return given()
                .contentType(ContentType.JSON)
                .body(new LoginRequest(email, senhaInicial))
                .when()
                .post("/api/auth/login")
                .then()
                .statusCode(200)
                .extract()
                .path("token");
    }

    // Mimetiza exatamente o DataSeeder (admin do bootstrap do Docker): grava
    // usuario + usuario_cargo diretamente, sem passar por UsuarioService.criar(),
    // que é o único lugar que hoje cria a linha de preferencia_usuario. Antes
    // da correção, GET/PATCH /me/preferencias para esse tipo de usuário
    // respondia 404 "Usuario nao encontrado" mesmo o usuário existindo.
    private String criarUsuarioSemPreferenciasEObterToken(String email, String senha) {
        Usuario usuario = new Usuario();
        usuario.setEmail(email);
        usuario.setSenha(passwordEncoder.encode(senha));
        usuario.setNome("Seed");
        usuario.setSobrenome("SemPreferencias");
        usuarioRepository.save(usuario);

        Cargo cargoAdministrador = cargoRepository.findById(CARGO_ADMINISTRADOR_ID).orElseThrow();
        UsuarioCargo vinculo = new UsuarioCargo();
        vinculo.setUsuario(usuario);
        vinculo.setCargo(cargoAdministrador);
        usuarioCargoRepository.save(vinculo);

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

    @Test
    void deveCriarPreferenciasPadraoAoConsultarUsuarioSemLinhaDePreferencias() {
        String token = criarUsuarioSemPreferenciasEObterToken(
                "teste.seed.sem.preferencias.get@itu.sp.gov.br", "SenhaInicial123");

        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get("/api/usuarios/me/preferencias")
                .then()
                .statusCode(200)
                .body("tema", equalTo("LIGHT"))
                .body("densidade", equalTo("NORMAL"))
                .body("notifAlertasCriticos", equalTo(true));
    }

    @Test
    void deveCriarPreferenciasAoAtualizarUsuarioSemLinhaDePreferencias() {
        String token = criarUsuarioSemPreferenciasEObterToken(
                "teste.seed.sem.preferencias.patch@itu.sp.gov.br", "SenhaInicial123");

        PreferenciaUsuarioRequest request = new PreferenciaUsuarioRequest(
                TemaUsuario.DARK, DensidadeUsuario.COMPACTO, true, true, true, true, false);

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + token)
                .body(request)
                .when()
                .patch("/api/usuarios/me/preferencias")
                .then()
                .statusCode(200)
                .body("tema", equalTo("DARK"))
                .body("densidade", equalTo("COMPACTO"));
    }

    @Test
    void deveRetornarPerfilProprio() {
        given()
                .header("Authorization", "Bearer " + tokenUsuario)
                .when()
                .get("/api/usuarios/me")
                .then()
                .statusCode(200)
                .body("email", equalTo(EMAIL_USUARIO));
    }

    @Test
    void deveAtualizarTelefoneDoPerfilProprio() {
        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenUsuario)
                .body(new AtualizarPerfilRequest("(11) 99999-0000"))
                .when()
                .patch("/api/usuarios/me")
                .then()
                .statusCode(200);
    }

    @Test
    void deveRetornarPreferenciasPadraoDoUsuarioRecemCriado() {
        // Usuário dedicado (não o EMAIL_USUARIO compartilhado): esta asserção só
        // faz sentido para um usuário cujas preferências ninguém mais alterou.
        String tokenUsuarioDedicado = criarUsuarioEObterToken(
                "teste.perfil.preferencias.default@itu.sp.gov.br", "SenhaInicial123");

        given()
                .header("Authorization", "Bearer " + tokenUsuarioDedicado)
                .when()
                .get("/api/usuarios/me/preferencias")
                .then()
                .statusCode(200)
                .body("tema", equalTo("LIGHT"))
                .body("densidade", equalTo("NORMAL"))
                .body("notifAlertasCriticos", equalTo(true));
    }

    @Test
    void deveAtualizarPreferencias() {
        PreferenciaUsuarioRequest request = new PreferenciaUsuarioRequest(
                TemaUsuario.DARK, DensidadeUsuario.COMPACTO, true, false, false, true, true);

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenUsuario)
                .body(request)
                .when()
                .patch("/api/usuarios/me/preferencias")
                .then()
                .statusCode(200)
                .body("tema", equalTo("DARK"))
                .body("densidade", equalTo("COMPACTO"))
                .body("notifVacinaVencendo", equalTo(false));
    }

    @Test
    void deveRetornar422QuandoTentaDesativarNotificacaoDeAlertasCriticos() {
        PreferenciaUsuarioRequest request = new PreferenciaUsuarioRequest(
                TemaUsuario.LIGHT, DensidadeUsuario.NORMAL, false, true, true, true, false);

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenUsuario)
                .body(request)
                .when()
                .patch("/api/usuarios/me/preferencias")
                .then()
                .statusCode(422);
    }
}
