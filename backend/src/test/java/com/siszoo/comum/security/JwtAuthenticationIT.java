package com.siszoo.comum.security;

import static io.restassured.RestAssured.given;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.usuarios.dto.LoginRequest;
import com.siszoo.usuarios.entity.Cargo;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.entity.UsuarioCargo;
import com.siszoo.usuarios.repository.CargoRepository;
import com.siszoo.usuarios.repository.UsuarioCargoRepository;
import com.siszoo.usuarios.repository.UsuarioRepository;

import io.restassured.http.ContentType;

@Import(TesteProtegidoController.class)
class JwtAuthenticationIT extends AbstractIntegrationTest {

    private static final UUID CARGO_ADMINISTRADOR_ID = UUID.fromString("00000000-0000-4000-8000-000000000001");
    private static final UUID CARGO_VETERINARIO_ID = UUID.fromString("00000000-0000-4000-8000-000000000002");
    private static final String SENHA_TESTE = "SenhaValida123";
    private static final String ROTA_PROTEGIDA = "/api/teste/protegido";

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private CargoRepository cargoRepository;

    @Autowired
    private UsuarioCargoRepository usuarioCargoRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void healthSemTokenRetorna200() {
        given()
                .when()
                .get("/api/health")
                .then()
                .statusCode(200);
    }

    @Test
    void rotaProtegidaSemTokenRetorna401() {
        given()
                .when()
                .get(ROTA_PROTEGIDA)
                .then()
                .statusCode(401);
    }

    @Test
    void rotaProtegidaComTokenInvalidoRetorna401() {
        given()
                .header("Authorization", "Bearer token-invalido")
                .when()
                .get(ROTA_PROTEGIDA)
                .then()
                .statusCode(401);
    }

    @Test
    void veterinarioSemAutoridadeUsuariosAcessoRetorna403() {
        String token = logarComo("veterinario.protegido@itu.sp.gov.br", CARGO_VETERINARIO_ID);

        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get(ROTA_PROTEGIDA)
                .then()
                .statusCode(403);
    }

    @Test
    void administradorComAutoridadeUsuariosAcessoRetorna200() {
        String token = logarComo("administrador.protegido@itu.sp.gov.br", CARGO_ADMINISTRADOR_ID);

        given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get(ROTA_PROTEGIDA)
                .then()
                .statusCode(200);
    }

    private String logarComo(String email, UUID cargoId) {
        if (usuarioRepository.findByEmail(email).isEmpty()) {
            Usuario usuario = new Usuario();
            usuario.setEmail(email);
            usuario.setSenha(passwordEncoder.encode(SENHA_TESTE));
            usuario.setNome("Teste");
            usuario.setSobrenome("Autorizacao");
            usuarioRepository.save(usuario);

            Cargo cargo = cargoRepository.findById(cargoId).orElseThrow();
            UsuarioCargo vinculo = new UsuarioCargo();
            vinculo.setUsuario(usuario);
            vinculo.setCargo(cargo);
            usuarioCargoRepository.save(vinculo);
        }

        return given()
                .contentType(ContentType.JSON)
                .body(new LoginRequest(email, SENHA_TESTE))
                .when()
                .post("/api/auth/login")
                .then()
                .statusCode(200)
                .extract()
                .path("token");
    }
}
