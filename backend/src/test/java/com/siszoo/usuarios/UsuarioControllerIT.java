package com.siszoo.usuarios;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.usuarios.dto.AtualizarStatusUsuarioRequest;
import com.siszoo.usuarios.dto.CriarUsuarioRequest;
import com.siszoo.usuarios.dto.LoginRequest;
import com.siszoo.usuarios.entity.Cargo;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.entity.UsuarioCargo;
import com.siszoo.usuarios.repository.CargoRepository;
import com.siszoo.usuarios.repository.UsuarioCargoRepository;
import com.siszoo.usuarios.repository.UsuarioRepository;

import io.restassured.http.ContentType;

class UsuarioControllerIT extends AbstractIntegrationTest {

    private static final UUID CARGO_ADMINISTRADOR_ID = UUID.fromString("00000000-0000-4000-8000-000000000001");
    private static final UUID CARGO_AGENTE_SANITARIO_ID = UUID.fromString("00000000-0000-4000-8000-000000000003");
    private static final String EMAIL_ADMIN = "teste.admin.usuarios@itu.sp.gov.br";
    private static final String SENHA_ADMIN = "SenhaAdmin123";

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private CargoRepository cargoRepository;

    @Autowired
    private UsuarioCargoRepository usuarioCargoRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String tokenAdmin;

    @BeforeEach
    void seedAdmin() {
        if (usuarioRepository.findByEmail(EMAIL_ADMIN).isEmpty()) {
            Usuario admin = new Usuario();
            admin.setEmail(EMAIL_ADMIN);
            admin.setSenha(passwordEncoder.encode(SENHA_ADMIN));
            admin.setNome("Admin");
            admin.setSobrenome("Teste");
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
    }

    @Test
    void deveListarUsuariosPaginado() {
        given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .queryParam("pagina", 0)
                .queryParam("tamanho", 10)
                .when()
                .get("/api/usuarios")
                .then()
                .statusCode(200)
                .body("itens.size()", greaterThanOrEqualTo(1))
                .body("pagina", equalTo(0))
                .body("tamanho", equalTo(10));
    }

    @Test
    void deveCriarUsuarioComSucesso() {
        CriarUsuarioRequest request = new CriarUsuarioRequest(
                "Novo", "Agente", "novo.agente@itu.sp.gov.br", "Agente Sanitário", null, null, "SenhaInicial123");

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(request)
                .when()
                .post("/api/usuarios")
                .then()
                .statusCode(200)
                .body("email", equalTo("novo.agente@itu.sp.gov.br"))
                .body("cargos", hasItem("Agente Sanitário"))
                .body("senhaAlteradaEm", nullValue());
    }

    @Test
    void deveRetornar409QuandoEmailJaCadastrado() {
        CriarUsuarioRequest request = new CriarUsuarioRequest(
                "Duplicado", "Teste", EMAIL_ADMIN, "Agente Sanitário", null, null, "SenhaInicial123");

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(request)
                .when()
                .post("/api/usuarios")
                .then()
                .statusCode(409);
    }

    @Test
    void deveRetornar422QuandoCrmvAusenteParaVeterinario() {
        CriarUsuarioRequest request = new CriarUsuarioRequest(
                "Sem", "Crmv", "sem.crmv@itu.sp.gov.br", "Veterinário", null, null, "SenhaInicial123");

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(request)
                .when()
                .post("/api/usuarios")
                .then()
                .statusCode(422);
    }

    @Test
    void deveAlterarStatusDoUsuario() {
        Usuario usuario = new Usuario();
        usuario.setEmail("teste.status@itu.sp.gov.br");
        usuario.setSenha(passwordEncoder.encode("SenhaQualquer123"));
        usuario.setNome("Status");
        usuario.setSobrenome("Teste");
        usuarioRepository.save(usuario);

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(new AtualizarStatusUsuarioRequest(false))
                .when()
                .patch("/api/usuarios/" + usuario.getId() + "/status")
                .then()
                .statusCode(200)
                .body("email", equalTo("teste.status@itu.sp.gov.br"));

        Usuario atualizado = usuarioRepository.findById(usuario.getId()).orElseThrow();
        assertThat(atualizado.isAtivo(), equalTo(false));
        assertThat(atualizado.getDesativadoEm(), notNullValue());
    }

    @Test
    void deveRetornar403QuandoUsuarioSemAutoridadeTentaListar() {
        Usuario agente = new Usuario();
        agente.setEmail("teste.agente.sememautoridade@itu.sp.gov.br");
        agente.setSenha(passwordEncoder.encode("SenhaAgente123"));
        agente.setNome("Agente");
        agente.setSobrenome("SemAutoridade");
        usuarioRepository.save(agente);

        Cargo cargoAgente = cargoRepository.findById(CARGO_AGENTE_SANITARIO_ID).orElseThrow();
        UsuarioCargo vinculo = new UsuarioCargo();
        vinculo.setUsuario(agente);
        vinculo.setCargo(cargoAgente);
        usuarioCargoRepository.save(vinculo);

        String tokenAgente = given()
                .contentType(ContentType.JSON)
                .body(new LoginRequest("teste.agente.sememautoridade@itu.sp.gov.br", "SenhaAgente123"))
                .when()
                .post("/api/auth/login")
                .then()
                .statusCode(200)
                .extract()
                .path("token");

        given()
                .header("Authorization", "Bearer " + tokenAgente)
                .when()
                .get("/api/usuarios")
                .then()
                .statusCode(403);
    }
}
