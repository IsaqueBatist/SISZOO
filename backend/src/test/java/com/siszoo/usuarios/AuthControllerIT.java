package com.siszoo.usuarios;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.notNullValue;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

import javax.crypto.SecretKey;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.usuarios.dto.LoginRequest;
import com.siszoo.usuarios.entity.Cargo;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.entity.UsuarioCargo;
import com.siszoo.usuarios.repository.CargoRepository;
import com.siszoo.usuarios.repository.UsuarioCargoRepository;
import com.siszoo.usuarios.repository.UsuarioRepository;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import io.restassured.http.ContentType;

class AuthControllerIT extends AbstractIntegrationTest {

    private static final UUID CARGO_VETERINARIO_ID = UUID.fromString("00000000-0000-4000-8000-000000000002");
    private static final String EMAIL_TESTE = "teste.login@itu.sp.gov.br";
    private static final String SENHA_TESTE = "SenhaValida123";

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private CargoRepository cargoRepository;

    @Autowired
    private UsuarioCargoRepository usuarioCargoRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${siszoo.jwt.secret}")
    private String jwtSecret;

    @BeforeEach
    void seedUsuarioDeTeste() {
        if (usuarioRepository.findByEmail(EMAIL_TESTE).isPresent()) {
            return;
        }

        Usuario usuario = new Usuario();
        usuario.setEmail(EMAIL_TESTE);
        usuario.setSenha(passwordEncoder.encode(SENHA_TESTE));
        usuario.setNome("Teste");
        usuario.setSobrenome("Login");
        usuarioRepository.save(usuario);

        Cargo cargoVeterinario = cargoRepository.findById(CARGO_VETERINARIO_ID).orElseThrow();
        UsuarioCargo vinculo = new UsuarioCargo();
        vinculo.setUsuario(usuario);
        vinculo.setCargo(cargoVeterinario);
        usuarioCargoRepository.save(vinculo);
    }

    @Test
    void deveRetornarTokenValidoParaCredencialCorreta() {
        String token = given()
                .contentType(ContentType.JSON)
                .body(new LoginRequest(EMAIL_TESTE, SENHA_TESTE))
                .when()
                .post("/api/auth/login")
                .then()
                .statusCode(200)
                .body("token", notNullValue())
                .body("usuario.email", equalTo(EMAIL_TESTE))
                .extract()
                .path("token");

        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
        Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();

        assertThat(claims.getExpiration().getTime(), greaterThan(System.currentTimeMillis()));

        @SuppressWarnings("unchecked")
        List<String> cargos = claims.get("cargos", List.class);
        assertThat(cargos, hasItem("Veterinário"));
    }

    @Test
    void deveRetornar401ParaSenhaIncorreta() {
        given()
                .contentType(ContentType.JSON)
                .body(new LoginRequest(EMAIL_TESTE, "senhaErrada"))
                .when()
                .post("/api/auth/login")
                .then()
                .statusCode(401);
    }
}
