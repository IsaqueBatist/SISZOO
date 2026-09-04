package com.siszoo.alertas.controller;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.siszoo.animais.clinico.dto.CriarVacinacaoRequest;
import com.siszoo.animais.clinico.entity.Vacina;
import com.siszoo.animais.clinico.entity.Vacinacao;
import com.siszoo.animais.clinico.repository.VacinaRepository;
import com.siszoo.animais.clinico.repository.VacinacaoRepository;
import com.siszoo.animais.dto.CriarAnimalRequest;
import com.siszoo.animais.repository.AnimalRepository;
import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.usuarios.dto.LoginRequest;
import com.siszoo.usuarios.entity.Cargo;
import com.siszoo.usuarios.entity.Usuario;
import com.siszoo.usuarios.entity.UsuarioCargo;
import com.siszoo.usuarios.repository.CargoRepository;
import com.siszoo.usuarios.repository.UsuarioCargoRepository;
import com.siszoo.usuarios.repository.UsuarioRepository;

import io.restassured.http.ContentType;

// "antirrabica" (seed V5) tem intervalo_meses=12: a data_validade de cada
// cenario e controlada escolhendo dataAplicacao = HOJE.minusMonths(12) +/-
// alguns dias, ja que HOJE (02/09) esta longe de qualquer virada de mes que
// quebraria plusMonths/minusMonths.
@Import(AlertaVacinalControllerIT.ClockDeTesteConfig.class)
class AlertaVacinalControllerIT extends AbstractIntegrationTest {

    private static final UUID CARGO_ADMINISTRADOR_ID = UUID.fromString("00000000-0000-4000-8000-000000000001");
    private static final String EMAIL_ADMIN = "teste.admin.alertas@itu.sp.gov.br";
    private static final String SENHA_ADMIN = "SenhaAdmin123";
    static final LocalDate HOJE = LocalDate.of(2026, 9, 2);

    @TestConfiguration
    static class ClockDeTesteConfig {
        @Bean
        @Primary
        Clock clockFixoDeTeste() {
            ZoneId fuso = ZoneId.of("America/Sao_Paulo");
            return Clock.fixed(HOJE.atStartOfDay(fuso).toInstant(), fuso);
        }
    }

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private CargoRepository cargoRepository;

    @Autowired
    private UsuarioCargoRepository usuarioCargoRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AnimalRepository animalRepository;

    @Autowired
    private VacinaRepository vacinaRepository;

    @Autowired
    private VacinacaoRepository vacinacaoRepository;

    private String tokenAdmin;

    @BeforeEach
    void seedAdmin() {
        if (usuarioRepository.findByEmail(EMAIL_ADMIN).isEmpty()) {
            Usuario admin = new Usuario();
            admin.setEmail(EMAIL_ADMIN);
            admin.setSenha(passwordEncoder.encode(SENHA_ADMIN));
            admin.setNome("Admin");
            admin.setSobrenome("Alertas");
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
    void deveMarcarComoVencidaUmDiaAposOVencimentoEDevolverDadosDeAnimalEVeterinario() {
        String animalId = criarAnimalViaApi();
        criarVacinacaoViaApi(animalId, HOJE.minusMonths(12).minusDays(1));

        Map<String, Object> animal = buscarAnimalNaResposta(animalId)
                .orElseThrow(() -> new AssertionError("Animal " + animalId + " nao apareceu nos alertas"));
        assertThat(animal.get("animalEspecieNome"), equalTo("Canino"));
        assertThat(animal.get("animalSexo"), equalTo("macho"));
        assertThat(animal.get("animalBaiaNome"), equalTo(null));

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> vacinas = (List<Map<String, Object>>) animal.get("vacinas");
        assertThat(vacinas, hasSize(1));
        assertThat(vacinas.get(0).get("severidade"), equalTo("VENCIDA"));
        assertThat(numero(vacinas.get(0).get("diasRestantes")), equalTo(-1L));
        assertThat(vacinas.get(0).get("veterinarioNome"), equalTo("Admin Alertas"));
    }

    @Test
    void deveMarcarComoAVencerNoDiaExatoDoVencimento() {
        String animalId = criarAnimalViaApi();
        criarVacinacaoViaApi(animalId, HOJE.minusMonths(12));

        List<Map<String, Object>> vacinas = buscarVacinasDoAnimal(animalId);

        assertThat(vacinas, hasSize(1));
        assertThat(vacinas.get(0).get("severidade"), equalTo("A_VENCER"));
        assertThat(numero(vacinas.get(0).get("diasRestantes")), equalTo(0L));
    }

    @Test
    void deveMarcarComoAVencerNoLimiteSuperiorDaJanelaDeSeteDias() {
        String animalId = criarAnimalViaApi();
        criarVacinacaoViaApi(animalId, HOJE.minusMonths(12).plusDays(7));

        List<Map<String, Object>> vacinas = buscarVacinasDoAnimal(animalId);

        assertThat(vacinas, hasSize(1));
        assertThat(vacinas.get(0).get("severidade"), equalTo("A_VENCER"));
        assertThat(numero(vacinas.get(0).get("diasRestantes")), equalTo(7L));
    }

    @Test
    void naoDeveRetornarVacinaComVencimentoForaDaJanelaDeSeteDias() {
        String animalId = criarAnimalViaApi();
        criarVacinacaoViaApi(animalId, HOJE.minusMonths(12).plusDays(8));

        assertThat(buscarAnimalNaResposta(animalId).isPresent(), equalTo(false));
    }

    @Test
    void deveConsiderarSoAAplicacaoMaisRecenteDeCadaVacinaPorAnimal() {
        String animalId = criarAnimalViaApi();
        // Aplicacao antiga: isolada, estaria VENCIDA ha 12 meses.
        criarVacinacaoViaApi(animalId, HOJE.minusMonths(24));
        // Reforco recente: dataValidade cai bem fora da janela de alerta.
        criarVacinacaoViaApi(animalId, HOJE);

        assertThat(buscarAnimalNaResposta(animalId).isPresent(), equalTo(false));
    }

    @Test
    void deveDevolverUmSoItemQuandoDuasAplicacoesIndependentesTemAMesmaDataAplicacao() {
        String animalId = criarAnimalViaApi();
        // Duas vacinacoes independentes (sem retificacao entre elas) para o
        // mesmo animal+vacina, com a mesma dataAplicacao — a query precisa
        // desempatar (por criadoEm, o registro mais recente) e devolver 1 so.
        criarVacinacaoViaApi(animalId, HOJE.minusMonths(12).minusDays(1));
        criarVacinacaoViaApi(animalId, HOJE.minusMonths(12).minusDays(1));

        List<Map<String, Object>> vacinas = buscarVacinasDoAnimal(animalId);

        assertThat(vacinas, hasSize(1));
        assertThat(vacinas.get(0).get("severidade"), equalTo("VENCIDA"));
    }

    @Test
    void deveConsiderarSoORegistroFinalDeUmaCadeiaDeRetificacaoComDoisElos() {
        String animalId = criarAnimalViaApi();
        LocalDate dataVencida = HOJE.minusMonths(12).minusDays(1);

        String idA = criarVacinacaoViaApi(animalId, dataVencida, null);
        String idB = criarVacinacaoViaApi(animalId, dataVencida, idA);
        String idC = criarVacinacaoViaApi(animalId, dataVencida, idB);

        List<Map<String, Object>> vacinas = buscarVacinasDoAnimal(animalId);

        assertThat(vacinas, hasSize(1));
        assertThat(vacinas.get(0).get("vacinacaoId"), equalTo(idC));
        assertThat(vacinas.get(0).get("severidade"), equalTo("VENCIDA"));
    }

    @Test
    void naoDeveAlertarVacinaSemIntervaloDefinidoNoCatalogo() {
        String animalId = criarAnimalViaApi();
        Vacina vacinaSemIntervalo = new Vacina();
        vacinaSemIntervalo.setCodigo("teste-sem-intervalo-" + UUID.randomUUID().toString().substring(0, 8));
        vacinaSemIntervalo.setNome("Vacina Teste Sem Intervalo");
        vacinaSemIntervalo.setIntervaloMeses(null);
        vacinaRepository.save(vacinaSemIntervalo);

        Vacinacao vacinacao = new Vacinacao();
        vacinacao.setAnimal(animalRepository.findById(UUID.fromString(animalId)).orElseThrow());
        vacinacao.setVacina(vacinaSemIntervalo);
        vacinacao.setDataAplicacao(HOJE.minusMonths(12).minusDays(1));
        vacinacao.setDoseQuantidade(new BigDecimal("1.000"));
        vacinacaoRepository.save(vacinacao);

        assertThat(buscarAnimalNaResposta(animalId).isPresent(), equalTo(false));
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> buscarVacinasDoAnimal(String animalId) {
        return (List<Map<String, Object>>) buscarAnimalNaResposta(animalId)
                .orElseThrow(() -> new AssertionError("Animal " + animalId + " nao apareceu nos alertas"))
                .get("vacinas");
    }

    private java.util.Optional<Map<String, Object>> buscarAnimalNaResposta(String animalId) {
        List<Map<String, Object>> resposta = given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when()
                .get("/api/alertas/vacinas")
                .then()
                .statusCode(200)
                .extract()
                .jsonPath()
                .getList("$");

        return resposta.stream().filter(item -> animalId.equals(item.get("animalId"))).findFirst();
    }

    private long numero(Object valor) {
        return ((Number) valor).longValue();
    }

    private String criarVacinacaoViaApi(String animalId, LocalDate dataAplicacao) {
        return criarVacinacaoViaApi(animalId, dataAplicacao, null);
    }

    private String criarVacinacaoViaApi(String animalId, LocalDate dataAplicacao, String retificaId) {
        return given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(new CriarVacinacaoRequest(
                        UUID.fromString(animalId), "antirrabica", dataAplicacao, 1,
                        new BigDecimal("1.000"), null, "LOTE-1", null,
                        retificaId == null ? null : UUID.fromString(retificaId)))
                .when()
                .post("/api/vacinacoes")
                .then()
                .statusCode(200)
                .extract()
                .path("id");
    }

    private String criarAnimalViaApi() {
        CriarAnimalRequest request = new CriarAnimalRequest(
                "Animal Alerta Vacinal", "canino", "macho", null, null, null, null, null, null, null,
                microchipUnico(), false, null, "disponivel_adocao", "resgate", LocalDateTime.now(),
                null, null, null);

        return given()
                .contentType(ContentType.JSON)
                .header("Authorization", "Bearer " + tokenAdmin)
                .body(request)
                .when()
                .post("/api/animais")
                .then()
                .statusCode(200)
                .extract()
                .path("id");
    }

    private String microchipUnico() {
        return "MC" + UUID.randomUUID().toString().substring(0, 20);
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
