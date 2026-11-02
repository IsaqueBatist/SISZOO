package com.siszoo.alertas.controller;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;
import com.siszoo.comum.RelogioTesteConfig;

@Import(RelogioTesteConfig.class)
class AlertaEsterilizacaoControllerIT extends AbstractIntegrationTest {

    private static final String ROTA = "/api/alertas/esterilizacao";

    @Autowired
    private ApiTesteFixture fixture;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private String tokenAdmin;

    @BeforeEach
    void autenticarAdmin() {
        tokenAdmin = fixture.tokenAdmin("teste.admin.esterilizacao@itu.sp.gov.br", "Esterilizacao");
    }

    @Test
    @DisplayName("entrada ha 73 h, nao esterilizado e sob custodia aparece com as horas desde a entrada")
    void animalComEntradaHaSetentaETresHorasAparece() {
        String animalId = animalComEntradaHa(73, "disponivel_adocao");

        Map<String, Object> alerta = buscarNoAlerta(animalId)
                .orElseThrow(() -> new AssertionError("Animal " + animalId + " nao apareceu no alerta"));
        assertThat(((Number) alerta.get("horasDesdeEntrada")).longValue(), equalTo(73L));
        assertThat(alerta.get("animalEspecieNome"), equalTo("Canino"));
        assertThat(alerta.get("animalStatusNome"), equalTo("Disponível"));
    }

    @Test
    @DisplayName("entrada ha 71 h nao aparece")
    void animalComEntradaHaSetentaEUmaHorasNaoAparece() {
        String animalId = animalComEntradaHa(71, "disponivel_adocao");

        assertThat(buscarNoAlerta(animalId).isPresent(), equalTo(false));
    }

    @Test
    @DisplayName("animal esterilizado nao aparece")
    void animalEsterilizadoNaoAparece() {
        String animalId = animalComEntradaHa(100, "em_tratamento");
        jdbcTemplate.update("update animal set esterilizado = true where id = ?::uuid", animalId);

        assertThat(buscarNoAlerta(animalId).isPresent(), equalTo(false));
    }

    @ParameterizedTest
    @ValueSource(strings = {"obito_natural", "obito_eutanasia", "transferido", "adotado"})
    @DisplayName("animal com status de obito ou de saida nao aparece")
    void animalForaDaCustodiaNaoAparece(String status) {
        String animalId = animalComEntradaHa(100, "disponivel_adocao");
        jdbcTemplate.update(
                "update animal set status_id = (select id from status_animal where codigo = ?) where id = ?::uuid",
                status, animalId);

        assertThat(buscarNoAlerta(animalId).isPresent(), equalTo(false));
    }

    @Test
    @DisplayName("o alerta entra na contagem esterilizacao_72h do dashboard")
    void alertaEntraNaContagemDoDashboard() {
        long antes = totalNoDashboard();

        animalComEntradaHa(80, "em_quarentena");

        assertThat(totalNoDashboard(), equalTo(antes + 1));
    }

    @Test
    @DisplayName("401 sem token")
    void deveRetornar401SemToken() {
        given().when().get(ROTA).then().statusCode(401);
    }

    private String animalComEntradaHa(int horas, String status) {
        String animalId = fixture.criarAnimal(tokenAdmin, status);
        LocalDateTime entrada = fixture.agora().minusHours(horas);
        jdbcTemplate.update("update animal set data_entrada = ? where id = ?::uuid", entrada, animalId);
        return animalId;
    }

    private Optional<Map<String, Object>> buscarNoAlerta(String animalId) {
        List<Map<String, Object>> alertas = given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when().get(ROTA)
                .then().statusCode(200)
                .extract().jsonPath().getList("$");
        return alertas.stream().filter(alerta -> animalId.equals(alerta.get("animalId"))).findFirst();
    }

    private long totalNoDashboard() {
        List<Map<String, Object>> alertas = given()
                .header("Authorization", "Bearer " + tokenAdmin)
                .when().get("/api/dashboard/kpis")
                .then().statusCode(200)
                .extract().jsonPath().getList("alertas");
        return alertas.stream()
                .filter(alerta -> "esterilizacao_72h".equals(alerta.get("tipo")))
                .map(alerta -> ((Number) alerta.get("total")).longValue())
                .findFirst()
                .orElseThrow();
    }
}
