package com.siszoo.comum.security.rbac;

import static io.restassured.RestAssured.given;

import java.util.UUID;
import java.util.stream.Stream;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
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

// T13: prova por HTTP real (token JWT emitido pelo login de produção, nunca fabricado
// manualmente) que cada perfil só acessa os endpoints permitidos pela matriz de cargos
// semeada em V3__seed_cargos.sql. Cada caso-âncora afirma tanto o 200 do perfil
// autorizado quanto o 403 dos demais.
@Import({
        ScaffoldCriarUsuarioController.class,
        ScaffoldListarUsuariosController.class,
        ScaffoldEscreverAnimalController.class
})
class RbacMatrixIT extends AbstractIntegrationTest {

    private static final String SENHA_TESTE = "SenhaValida123";
    private static final String ROTA_USUARIOS = "/api/teste/rbac/usuarios";
    private static final String ROTA_ANIMAIS = "/api/teste/rbac/animais";

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private CargoRepository cargoRepository;

    @Autowired
    private UsuarioCargoRepository usuarioCargoRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private enum Perfil {
        ADMINISTRADOR("00000000-0000-4000-8000-000000000001", "administrador.rbac@itu.sp.gov.br"),
        VETERINARIO("00000000-0000-4000-8000-000000000002", "veterinario.rbac@itu.sp.gov.br"),
        AGENTE_SANITARIO("00000000-0000-4000-8000-000000000003", "agente.rbac@itu.sp.gov.br");

        private final UUID cargoId;
        private final String email;

        Perfil(String cargoId, String email) {
            this.cargoId = UUID.fromString(cargoId);
            this.email = email;
        }
    }

    static Stream<Arguments> criarUsuarioPorPerfil() {
        return Stream.of(
                Arguments.of(Perfil.ADMINISTRADOR, 200),
                Arguments.of(Perfil.VETERINARIO, 403),
                Arguments.of(Perfil.AGENTE_SANITARIO, 403));
    }

    static Stream<Arguments> listarUsuariosPorPerfil() {
        return Stream.of(
                Arguments.of(Perfil.ADMINISTRADOR, 200),
                Arguments.of(Perfil.VETERINARIO, 403),
                Arguments.of(Perfil.AGENTE_SANITARIO, 403));
    }

    static Stream<Arguments> escreverAnimalPorPerfil() {
        return Stream.of(
                Arguments.of(Perfil.ADMINISTRADOR, 200),
                Arguments.of(Perfil.VETERINARIO, 200),
                Arguments.of(Perfil.AGENTE_SANITARIO, 403));
    }

    @ParameterizedTest(name = "{0} ao criar usuário -> status {1}")
    @MethodSource("criarUsuarioPorPerfil")
    void somenteAdminCriaUsuario(Perfil perfil, int statusEsperado) {
        given()
                .header("Authorization", "Bearer " + tokenPara(perfil))
                .when()
                .post(ROTA_USUARIOS)
                .then()
                .statusCode(statusEsperado);
    }

    @ParameterizedTest(name = "{0} ao listar usuários -> status {1}")
    @MethodSource("listarUsuariosPorPerfil")
    void veterinarioNaoAcessaUsuarios(Perfil perfil, int statusEsperado) {
        given()
                .header("Authorization", "Bearer " + tokenPara(perfil))
                .when()
                .get(ROTA_USUARIOS)
                .then()
                .statusCode(statusEsperado);
    }

    @ParameterizedTest(name = "{0} ao escrever animal -> status {1}")
    @MethodSource("escreverAnimalPorPerfil")
    void agenteSanitarioNaoEscreveAnimais(Perfil perfil, int statusEsperado) {
        given()
                .header("Authorization", "Bearer " + tokenPara(perfil))
                .when()
                .post(ROTA_ANIMAIS)
                .then()
                .statusCode(statusEsperado);
    }

    private String tokenPara(Perfil perfil) {
        if (usuarioRepository.findByEmail(perfil.email).isEmpty()) {
            Usuario usuario = new Usuario();
            usuario.setEmail(perfil.email);
            usuario.setSenha(passwordEncoder.encode(SENHA_TESTE));
            usuario.setNome("Teste");
            usuario.setSobrenome("Rbac");
            usuarioRepository.save(usuario);

            Cargo cargo = cargoRepository.findById(perfil.cargoId).orElseThrow();
            UsuarioCargo vinculo = new UsuarioCargo();
            vinculo.setUsuario(usuario);
            vinculo.setCargo(cargo);
            usuarioCargoRepository.save(vinculo);
        }

        return given()
                .contentType(ContentType.JSON)
                .body(new LoginRequest(perfil.email, SENHA_TESTE))
                .when()
                .post("/api/auth/login")
                .then()
                .statusCode(200)
                .extract()
                .path("token");
    }
}
