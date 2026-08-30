package com.siszoo.usuarios;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.empty;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
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
import com.siszoo.usuarios.dto.TrocarSenhaRequest;
import com.siszoo.usuarios.entity.AcaoAuditoria;
import com.siszoo.usuarios.entity.Cargo;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.entity.UsuarioCargo;
import com.siszoo.usuarios.repository.AuditoriaEventoRepository;
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
    private static final String EMAIL_COM_SENHA_JA_ALTERADA = "teste.senhajaalterada@itu.sp.gov.br";

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private CargoRepository cargoRepository;

    @Autowired
    private UsuarioCargoRepository usuarioCargoRepository;

    @Autowired
    private AuditoriaEventoRepository auditoriaEventoRepository;

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
                .body("usuario.senhaAlteradaEm", nullValue())
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
    void deveRetornarSenhaAlteradaEmPreenchidaQuandoUsuarioJaTrocouASenha() {
        Usuario usuario = new Usuario();
        usuario.setEmail(EMAIL_COM_SENHA_JA_ALTERADA);
        usuario.setSenha(passwordEncoder.encode(SENHA_TESTE));
        usuario.setNome("Teste");
        usuario.setSobrenome("SenhaAlterada");
        usuario.setSenhaAlteradaEm(LocalDateTime.now());
        usuarioRepository.save(usuario);

        given()
                .contentType(ContentType.JSON)
                .body(new LoginRequest(EMAIL_COM_SENHA_JA_ALTERADA, SENHA_TESTE))
                .when()
                .post("/api/auth/login")
                .then()
                .statusCode(200)
                .body("usuario.senhaAlteradaEm", notNullValue());
    }

    @Test
    void deveRegistrarEventoDeAuditoriaAoFazerLoginComSucesso() {
        given()
                .contentType(ContentType.JSON)
                .body(new LoginRequest(EMAIL_TESTE, SENHA_TESTE))
                .when()
                .post("/api/auth/login")
                .then()
                .statusCode(200);

        Usuario usuario = usuarioRepository.findByEmail(EMAIL_TESTE).orElseThrow();
        List<AcaoAuditoria> acoesRegistradas = auditoriaEventoRepository.findAll().stream()
                .filter(evento -> evento.getUsuario() != null && evento.getUsuario().getId().equals(usuario.getId()))
                .map(evento -> evento.getAcao())
                .filter(acao -> acao == AcaoAuditoria.LOGIN)
                .toList();

        assertThat(acoesRegistradas, not(empty()));
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

    @Test
    void deveTrocarSenhaComSucessoQuandoAutenticado() {
        String email = "teste.trocasenha.sucesso@itu.sp.gov.br";
        String senhaAtual = "SenhaAntiga123";
        Usuario usuario = new Usuario();
        usuario.setEmail(email);
        usuario.setSenha(passwordEncoder.encode(senhaAtual));
        usuario.setNome("Teste");
        usuario.setSobrenome("TrocaSenha");
        usuarioRepository.save(usuario);

        String token = obterToken(email, senhaAtual);

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + token)
                .body(new TrocarSenhaRequest("SenhaNovaValida123", "SenhaNovaValida123"))
                .when()
                .post("/api/auth/senha")
                .then()
                .statusCode(204);

        Usuario atualizado = usuarioRepository.findByEmail(email).orElseThrow();
        assertThat(atualizado.getSenhaAlteradaEm(), notNullValue());
        assertThat(passwordEncoder.matches("SenhaNovaValida123", atualizado.getSenha()), equalTo(true));
    }

    @Test
    void deveRetornar422QuandoNovaSenhaEConfirmacaoDivergem() {
        String email = "teste.trocasenha.divergente@itu.sp.gov.br";
        String senhaAtual = "SenhaAntiga123";
        Usuario usuario = new Usuario();
        usuario.setEmail(email);
        usuario.setSenha(passwordEncoder.encode(senhaAtual));
        usuario.setNome("Teste");
        usuario.setSobrenome("TrocaSenhaDivergente");
        usuarioRepository.save(usuario);

        String token = obterToken(email, senhaAtual);

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + token)
                .body(new TrocarSenhaRequest("SenhaNovaValida123", "OutraSenhaValida456"))
                .when()
                .post("/api/auth/senha")
                .then()
                .statusCode(422);
    }

    @Test
    void deveRetornar422QuandoNovaSenhaForMenorQueOitoCaracteres() {
        String email = "teste.trocasenha.curta@itu.sp.gov.br";
        String senhaAtual = "SenhaAntiga123";
        Usuario usuario = new Usuario();
        usuario.setEmail(email);
        usuario.setSenha(passwordEncoder.encode(senhaAtual));
        usuario.setNome("Teste");
        usuario.setSobrenome("TrocaSenhaCurta");
        usuarioRepository.save(usuario);

        String token = obterToken(email, senhaAtual);

        given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + token)
                .body(new TrocarSenhaRequest("curta1", "curta1"))
                .when()
                .post("/api/auth/senha")
                .then()
                .statusCode(422);
    }

    @Test
    void deveRetornar401AoTrocarSenhaSemToken() {
        given()
                .contentType(ContentType.JSON)
                .body(new TrocarSenhaRequest("SenhaNovaValida123", "SenhaNovaValida123"))
                .when()
                .post("/api/auth/senha")
                .then()
                .statusCode(401);
    }

    private String obterToken(String email, String senha) {
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
