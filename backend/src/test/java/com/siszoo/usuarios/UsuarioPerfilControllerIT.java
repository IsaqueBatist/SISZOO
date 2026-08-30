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

        String tokenAdmin = given()
                .contentType(ContentType.JSON)
                .body(new LoginRequest(EMAIL_ADMIN, SENHA_ADMIN))
                .when()
                .post("/api/auth/login")
                .then()
                .statusCode(200)
                .extract()
                .path("token");

        if (usuarioRepository.findByEmail(EMAIL_USUARIO).isEmpty()) {
            CriarUsuarioRequest request = new CriarUsuarioRequest(
                    "Perfil", "Teste", EMAIL_USUARIO, "Agente Sanitário", null, null, SENHA_INICIAL_USUARIO);

            given()
                    .contentType(ContentType.JSON)
                    .header("Authorization", "Bearer " + tokenAdmin)
                    .body(request)
                    .when()
                    .post("/api/usuarios")
                    .then()
                    .statusCode(200);
        }

        tokenUsuario = given()
                .contentType(ContentType.JSON)
                .body(new LoginRequest(EMAIL_USUARIO, SENHA_INICIAL_USUARIO))
                .when()
                .post("/api/auth/login")
                .then()
                .statusCode(200)
                .extract()
                .path("token");
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
        given()
                .header("Authorization", "Bearer " + tokenUsuario)
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
