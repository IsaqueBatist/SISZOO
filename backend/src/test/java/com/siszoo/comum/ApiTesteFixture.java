package com.siszoo.comum;

import static io.restassured.RestAssured.given;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.boot.test.context.TestComponent;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.siszoo.animais.clinico.dto.CriarVacinacaoRequest;
import com.siszoo.animais.clinico.entity.UnidadeDose;
import com.siszoo.animais.dto.CriarAnimalRequest;
import com.siszoo.usuarios.dto.LoginRequest;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.entity.UsuarioCargo;
import com.siszoo.usuarios.repository.CargoRepository;
import com.siszoo.usuarios.repository.UsuarioCargoRepository;
import com.siszoo.usuarios.repository.UsuarioRepository;

import io.restassured.http.ContentType;
import io.restassured.response.Response;

// Preparacao de cenario compartilhada pelos *IT (usuario + login, animal,
// vacinacao via API). Toda data vem do Clock do contexto — o fixo de
// RelogioTesteConfig quando a classe o importa, o de ClockConfig nos demais —
// para "hoje" do cenario ser o mesmo "hoje" das regras sob teste.
@TestComponent
public class ApiTesteFixture {

    public static final UUID CARGO_ADMINISTRADOR_ID = UUID.fromString("00000000-0000-4000-8000-000000000001");
    public static final UUID CARGO_VETERINARIO_ID = UUID.fromString("00000000-0000-4000-8000-000000000002");
    public static final UUID CARGO_AGENTE_SANITARIO_ID = UUID.fromString("00000000-0000-4000-8000-000000000003");
    private static final String SENHA_PADRAO = "SenhaTeste123";

    private final UsuarioRepository usuarioRepository;
    private final CargoRepository cargoRepository;
    private final UsuarioCargoRepository usuarioCargoRepository;
    private final PasswordEncoder passwordEncoder;
    private final Clock clock;

    public ApiTesteFixture(
            UsuarioRepository usuarioRepository,
            CargoRepository cargoRepository,
            UsuarioCargoRepository usuarioCargoRepository,
            PasswordEncoder passwordEncoder,
            Clock clock) {
        this.usuarioRepository = usuarioRepository;
        this.cargoRepository = cargoRepository;
        this.usuarioCargoRepository = usuarioCargoRepository;
        this.passwordEncoder = passwordEncoder;
        this.clock = clock;
    }

    public LocalDate hoje() {
        return LocalDate.now(clock);
    }

    public LocalDateTime agora() {
        return LocalDateTime.now(clock);
    }

    public String microchipUnico() {
        return "MC" + UUID.randomUUID().toString().substring(0, 20);
    }

    // Idempotente: o banco de teste e compartilhado entre metodos (sem
    // rollback), entao so cria o usuario na primeira chamada por e-mail.
    public String tokenComCargo(String email, String nome, String sobrenome, UUID cargoId) {
        if (usuarioRepository.findByEmail(email).isEmpty()) {
            Usuario usuario = criarUsuarioSemCargo(email, nome, sobrenome);
            UsuarioCargo vinculo = new UsuarioCargo();
            vinculo.setUsuario(usuario);
            vinculo.setCargo(cargoRepository.findById(cargoId).orElseThrow());
            usuarioCargoRepository.save(vinculo);
        }
        return login(email, SENHA_PADRAO);
    }

    public String tokenAdmin(String email, String sobrenome) {
        return tokenComCargo(email, "Admin", sobrenome, CARGO_ADMINISTRADOR_ID);
    }

    public Usuario criarUsuarioSemCargo(String email, String nome, String sobrenome) {
        Usuario usuario = new Usuario();
        usuario.setEmail(email);
        usuario.setSenha(passwordEncoder.encode(SENHA_PADRAO));
        usuario.setNome(nome);
        usuario.setSobrenome(sobrenome);
        return usuarioRepository.save(usuario);
    }

    public String criarAnimal(String token) {
        return criarAnimal(token, "disponivel_adocao");
    }

    public String criarAnimal(String token, String status) {
        CriarAnimalRequest request = new CriarAnimalRequest(
                "Animal de Teste", "canino", "macho", null, null, null, null, null, null, null,
                microchipUnico(), false, null, status, "resgate", agora(), null, null, null);

        return given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + token)
                .body(request)
                .when()
                .post("/api/animais")
                .then()
                .statusCode(200)
                .extract()
                .path("id");
    }

    // Resposta crua: o chamador decide o status esperado (200, 422...).
    public Response postarVacinacao(
            String token, String animalId, LocalDate dataAplicacao, UnidadeDose doseUnidade, String retificaId) {
        return given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + token)
                .body(new CriarVacinacaoRequest(
                        UUID.fromString(animalId), "antirrabica", dataAplicacao, 1,
                        new BigDecimal("1.000"), doseUnidade, "LOTE-1", null,
                        retificaId == null ? null : UUID.fromString(retificaId)))
                .when()
                .post("/api/vacinacoes");
    }

    // Caminho feliz: exige 200 e devolve o id criado.
    public String criarVacinacao(String token, String animalId, LocalDate dataAplicacao, String retificaId) {
        return postarVacinacao(token, animalId, dataAplicacao, UnidadeDose.MILILITRO, retificaId)
                .then()
                .statusCode(200)
                .extract()
                .path("id");
    }

    // GET /api/alertas/vacinas (exige 200) filtrado pelo animal do cenario —
    // o banco e compartilhado, entao o alerta traz animais de outros testes.
    public Optional<Map<String, Object>> buscarAnimalNoAlertaVacinal(String token, String animalId) {
        List<Map<String, Object>> resposta = given()
                .header("Authorization", "Bearer " + token)
                .when()
                .get("/api/alertas/vacinas")
                .then()
                .statusCode(200)
                .extract()
                .jsonPath()
                .getList("$");

        return resposta.stream().filter(item -> animalId.equals(item.get("animalId"))).findFirst();
    }

    // Senha explicita para usuarios criados fora do fixture — o AuthControllerIT
    // controla a senha de proposito, porque ela e o objeto do teste.
    public String login(String email, String senha) {
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
