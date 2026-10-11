package com.siszoo.comum;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;

import com.siszoo.animais.clinico.entity.UnidadeDose;

// "Hoje" das regras e o dia civil de America/Sao_Paulo, nao o de UTC. O
// relogio marca 02:00 UTC de 11/09 = 23:00 de 10/09 em Sao Paulo: quem usar
// o dia UTC acha que hoje e 11/09, quem usar o dia local acha que e 10/09.
// Cobre as duas regras que dependem de "hoje": o alerta vacinal (RN-A06 sobre
// RN-A01) e a data de aplicacao (RN-C06). Contexto proprio (nao usa
// RelogioTesteConfig) porque o instante precisa estar perto da virada do dia.
@Import(RegrasFusoHorarioIT.RelogioVesperaMeiaNoiteConfig.class)
class RegrasFusoHorarioIT extends AbstractIntegrationTest {

    private static final String EMAIL_ADMIN = "teste.admin.fuso@itu.sp.gov.br";
    private static final LocalDate HOJE_LOCAL = LocalDate.of(2026, 9, 10);

    @TestConfiguration
    static class RelogioVesperaMeiaNoiteConfig {
        @Bean
        @Primary
        Clock relogioVesperaMeiaNoite() {
            return Clock.fixed(Instant.parse("2026-09-11T02:00:00Z"), ZoneId.of("America/Sao_Paulo"));
        }
    }

    @Autowired
    private ApiTesteFixture fixture;

    private String tokenAdmin;

    @BeforeEach
    void autenticarAdmin() {
        tokenAdmin = fixture.tokenAdmin(EMAIL_ADMIN, "Fuso");
    }

    @Test
    @DisplayName("[RN-A06] 23:00 local: validade = hoje local + 7 ainda aparece (hoje e o dia de Sao Paulo)")
    void alertaDeveUsarODiaDeSaoPauloParaOLimiteSuperiorDaJanela() {
        String animalId = fixture.criarAnimal(tokenAdmin);
        // "antirrabica" tem intervalo_meses=12 (seed V5).
        fixture.criarVacinacao(tokenAdmin, animalId, HOJE_LOCAL.plusDays(7).minusMonths(12), null);

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> vacinas = (List<Map<String, Object>>) fixture.buscarAnimalNoAlertaVacinal(tokenAdmin, animalId)
                .orElseThrow(() -> new AssertionError("Animal " + animalId + " nao apareceu nos alertas"))
                .get("vacinas");
        assertThat(vacinas, hasSize(1));
        assertThat(((Number) vacinas.get(0).get("diasRestantes")).longValue(), equalTo(7L));
    }

    @Test
    @DisplayName("[RN-A06] 23:00 local: validade = hoje local + 8 fica fora (nao usa o dia UTC)")
    void alertaNaoDeveUsarODiaUtcParaOLimiteSuperiorDaJanela() {
        String animalId = fixture.criarAnimal(tokenAdmin);
        fixture.criarVacinacao(tokenAdmin, animalId, HOJE_LOCAL.plusDays(8).minusMonths(12), null);

        assertThat(fixture.buscarAnimalNoAlertaVacinal(tokenAdmin, animalId).isPresent(), equalTo(false));
    }

    @Test
    @DisplayName("[RN-C06] 23:00 local: dataAplicacao = dia local e aceita")
    void vacinacaoDeveAceitarODiaDeSaoPauloComoHoje() {
        fixture.postarVacinacao(tokenAdmin, fixture.criarAnimal(tokenAdmin), HOJE_LOCAL, UnidadeDose.MILILITRO, null)
                .then()
                .statusCode(200)
                .body("dataAplicacao", equalTo(HOJE_LOCAL.toString()));
    }

    // 11/09 ja e "hoje" em UTC, mas ainda e amanha em Sao Paulo.
    @Test
    @DisplayName("[RN-C06] 23:00 local: dataAplicacao = dia local + 1 (o dia UTC) retorna 422")
    void vacinacaoDeveRejeitarODiaUtcQuandoAindaEVesperaEmSaoPaulo() {
        fixture.postarVacinacao(
                        tokenAdmin, fixture.criarAnimal(tokenAdmin), HOJE_LOCAL.plusDays(1), UnidadeDose.MILILITRO, null)
                .then()
                .statusCode(422)
                .body("mensagem", equalTo("Data de aplicacao nao pode ser futura"));
    }
}
