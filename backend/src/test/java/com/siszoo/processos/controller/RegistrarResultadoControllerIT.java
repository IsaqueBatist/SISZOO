package com.siszoo.processos.controller;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.not;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.after;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;
import com.siszoo.comum.RelogioTesteConfig;

import io.restassured.http.ContentType;
import io.restassured.response.Response;

// T37 — Lancamento de resultado do processo sanitario: POST /{id}/resultado
// substitui o PATCH /status provisorio so para AGUARDANDO_RESULTADO ->
// COM_RESULTADO (R1/DH-10, docs/decisoes/T29.md e T37.md); notificacao
// assincrona (AFTER_COMMIT) ao municipe para positivo/inconclusivo; GET
// /{id}/historico para a mini trilha de auditoria.
//
// JavaMailSender mockado (classe inteira, nao so alguns testes): o envio e
// @Async, entao mesmo os testes que nao verificam notificacao nao podem
// deixar uma tentativa real de SMTP vazando para outra thread.
@Import(RelogioTesteConfig.class)
class RegistrarResultadoControllerIT extends AbstractIntegrationTest {

    private static final String ROTA = "/api/processos";

    @MockitoBean
    private JavaMailSender mailSender;

    @Autowired
    private ApiTesteFixture fixture;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private String tokenAgente;
    private String tokenVet;

    @BeforeEach
    void preparar() {
        reset(mailSender);
        tokenAgente = fixture.tokenComCargo("agente.resultado@itu.sp.gov.br", "Agente", "Resultado",
                ApiTesteFixture.CARGO_AGENTE_SANITARIO_ID);
        tokenVet = fixture.tokenComCargo("vet.resultado@itu.sp.gov.br", "Vet", "Resultado",
                ApiTesteFixture.CARGO_VETERINARIO_ID);
    }

    @Test
    @DisplayName("[T37] resultado negativo: grava resultado/data, avanca para COM_RESULTADO, sem notificacao")
    void resultadoNegativoNaoNotifica() {
        String processoId = processoAguardandoResultado(null);

        Response resposta = registrar(processoId, "negativo", "em_acompanhamento");

        resposta.then().statusCode(200);
        assertThat(resposta.path("statusProcesso"), equalTo("COM_RESULTADO"));
        assertThat(resposta.path("resultadoLaboratorial.codigo"), equalTo("negativo"));
        assertThat(resposta.path("dataResultado"), equalTo(RelogioTesteConfig.HOJE.toString()));
        assertThat(resposta.path("desfechoAnimal.codigo"), equalTo("em_acompanhamento"));
        verify(mailSender, after(1000).never()).send(any(SimpleMailMessage.class));
    }

    @Test
    @DisplayName("[T37/regra 19] resultado positivo notifica o municipe (assincrono)")
    void resultadoPositivoNotificaMunicipe() {
        String processoId = processoAguardandoResultado("maria@exemplo.com");

        registrar(processoId, "positivo", null).then().statusCode(200);

        verify(mailSender, timeout(5000)).send(any(SimpleMailMessage.class));
    }

    @Test
    @DisplayName("[T37/regra 19] resultado inconclusivo tambem notifica o municipe (assincrono)")
    void resultadoInconclusivoNotificaMunicipe() {
        String processoId = processoAguardandoResultado("maria@exemplo.com");

        registrar(processoId, "inconclusivo", null).then().statusCode(200);

        verify(mailSender, timeout(5000)).send(any(SimpleMailMessage.class));
    }

    @Test
    @DisplayName("[T37] e-mail indisponivel: resultado e salvo mesmo assim, e a tentativa de envio aconteceu")
    void resultadoSalvoMesmoComFalhaDeEmail() {
        doThrow(new MailSendException("SMTP indisponivel")).when(mailSender).send(any(SimpleMailMessage.class));
        String processoId = processoAguardandoResultado("maria@exemplo.com");

        Response resposta = registrar(processoId, "positivo", null);

        resposta.then().statusCode(200);
        assertThat(resposta.path("resultadoLaboratorial.codigo"), equalTo("positivo"));
        verify(mailSender, timeout(5000)).send(any(SimpleMailMessage.class));
    }

    @Test
    @DisplayName("[T37] fora de AGUARDANDO_RESULTADO: 422, sem gravar nada")
    void foraDeAguardandoResultadoRecusado() {
        String processoId = fixture.postarProcesso(tokenAgente, null, false).then().statusCode(200)
                .extract().path("id");

        registrar(processoId, "negativo", null).then().statusCode(422);
        assertThat(buscar(processoId).path("statusProcesso"), equalTo("ABERTO"));
    }

    @Test
    @DisplayName("[T37] PATCH /status nao pula AGUARDANDO_RESULTADO -> COM_RESULTADO: so o POST /resultado faz essa transicao")
    void patchStatusNaoAvancaParaComResultado() {
        String processoId = processoAguardandoResultado(null);

        given().header("Authorization", "Bearer " + tokenAgente).contentType(ContentType.JSON)
                .body(Map.of("status", "COM_RESULTADO"))
                .when().patch(ROTA + "/" + processoId + "/status")
                .then().statusCode(422);
        assertThat(buscar(processoId).path("statusProcesso"), equalTo("AGUARDANDO_RESULTADO"));
    }

    @Test
    @DisplayName("[T37/R1] codigo de resultado inexistente ou 'aguardando': 422, nada gravado")
    void codigoDeResultadoInvalido() {
        String processoId = processoAguardandoResultado(null);

        registrar(processoId, "nao_existe", null).then().statusCode(422);
        registrar(processoId, "aguardando", null).then().statusCode(422);
        assertThat(buscar(processoId).path("statusProcesso"), equalTo("AGUARDANDO_RESULTADO"));
    }

    @Test
    @DisplayName("[T37] codigo de desfecho inexistente: 422, nada gravado")
    void codigoDeDesfechoInvalido() {
        String processoId = processoAguardandoResultado(null);

        registrar(processoId, "negativo", "nao_existe").then().statusCode(422);
        assertThat(buscar(processoId).path("statusProcesso"), equalTo("AGUARDANDO_RESULTADO"));
    }

    @Test
    @DisplayName("[T37] write-once: depois do lancamento, o trigger da V14 recusa UPDATE direto em qualquer caminho")
    void resultadoImutavelParaQualquerCaminho() {
        String processoId = processoAguardandoResultado(null);
        registrar(processoId, "negativo", null).then().statusCode(200);

        assertThrows(DataIntegrityViolationException.class, () -> jdbcTemplate.update(
                "UPDATE processo_sanitario SET resultado_laboratorial_id = "
                        + "(SELECT id FROM resultado_laboratorial WHERE codigo = 'positivo') "
                        + "WHERE id = CAST(? AS uuid)", processoId));
        assertThrows(DataIntegrityViolationException.class, () -> jdbcTemplate.update(
                "UPDATE processo_sanitario SET data_resultado = data_resultado + 1 WHERE id = CAST(? AS uuid)",
                processoId));
        assertThat(buscar(processoId).path("resultadoLaboratorial.codigo"), equalTo("negativo"));
    }

    @Test
    @DisplayName("[T37] historico tem CRIACAO + ATUALIZACAO, sem payload nem dado do responsavel/denunciante")
    void historicoSemPayloadNemDadoPessoal() {
        Map<String, Object> corpo = fixture.corpoProcesso(null, false);
        corpo.put("responsavel", responsavelComEmail("maria@exemplo.com"));
        String processoId = fixture.postarProcesso(tokenAgente, corpo).then().statusCode(200).extract().path("id");
        avancarParaAguardandoResultado(processoId);
        registrar(processoId, "negativo", null).then().statusCode(200);

        Response historico = given().header("Authorization", "Bearer " + tokenVet)
                .when().get(ROTA + "/" + processoId + "/historico");

        // CRIACAO (POST) + ATUALIZACAO (PATCH /status para AGUARDANDO_RESULTADO)
        // + ATUALIZACAO (POST /resultado).
        historico.then().statusCode(200);
        assertThat(historico.path("acao"), containsInAnyOrder("CRIACAO", "ATUALIZACAO", "ATUALIZACAO"));
        for (Object item : historico.jsonPath().getList("$")) {
            assertThat(((Map<?, ?>) item).keySet(), containsInAnyOrder("id", "usuarioEmail", "acao", "ocorreuEm"));
        }
        assertThat(historico.asString(), not(containsString("payloadAntes")));
        assertThat(historico.asString(), not(containsString("payloadDepois")));
        assertThat(historico.asString(), not(containsString("Maria Responsavel")));
        assertThat(historico.asString(), not(containsString("maria@exemplo.com")));
    }

    @Test
    @DisplayName("[T37] historico de processo inexistente: 404")
    void historicoDeProcessoInexistente() {
        given().header("Authorization", "Bearer " + tokenAgente)
                .when().get(ROTA + "/" + UUID.randomUUID() + "/historico")
                .then().statusCode(404);
    }

    // ── Apoio ────────────────────────────────────────────

    private String processoAguardandoResultado(String emailResponsavel) {
        Map<String, Object> corpo = fixture.corpoProcesso(null, false);
        if (emailResponsavel != null) {
            corpo.put("responsavel", responsavelComEmail(emailResponsavel));
        }
        String id = fixture.postarProcesso(tokenAgente, corpo).then().statusCode(200).extract().path("id");
        avancarParaAguardandoResultado(id);
        return id;
    }

    private void avancarParaAguardandoResultado(String processoId) {
        given().header("Authorization", "Bearer " + tokenAgente).contentType(ContentType.JSON)
                .body(Map.of("status", "AGUARDANDO_RESULTADO"))
                .when().patch(ROTA + "/" + processoId + "/status")
                .then().statusCode(200);
    }

    private Response registrar(String processoId, String resultado, String desfecho) {
        Map<String, Object> corpo = new HashMap<>();
        corpo.put("resultadoLaboratorial", resultado);
        if (desfecho != null) {
            corpo.put("desfechoAnimal", desfecho);
        }
        return given().header("Authorization", "Bearer " + tokenAgente).contentType(ContentType.JSON)
                .body(corpo)
                .when().post(ROTA + "/" + processoId + "/resultado");
    }

    private Response buscar(String processoId) {
        return given().header("Authorization", "Bearer " + tokenAgente).when().get(ROTA + "/" + processoId);
    }

    private static Map<String, Object> responsavelComEmail(String email) {
        Map<String, Object> responsavel = new HashMap<>();
        responsavel.put("nome", "Maria Responsavel");
        responsavel.put("email", email);
        return responsavel;
    }
}
