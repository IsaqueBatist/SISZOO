package com.siszoo.processos.controller;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.after;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.MailSendException;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;
import com.siszoo.comum.RelogioTesteConfig;
import com.siszoo.comum.service.EmailService;

import io.restassured.http.ContentType;
import io.restassured.response.Response;

// T37 — o que a arquitetura de resultado da T34 (resultado_processo,
// retificação) não tinha: desfecho do animal no mesmo lançamento e
// notificação assíncrona ao município quando o vigente passa a "positivo"
// (regra 19, DER revisão 2026-10-17 — inconclusivo não notifica mais).
//
// EmailService (T35) mockado na classe inteira: o envio é @Async, então mesmo
// os testes que não verificam notificação não podem deixar uma tentativa real
// de SMTP vazando para outra thread. O envio real fica no EmailServiceIT.
@Import(RelogioTesteConfig.class)
class NotificacaoResultadoControllerIT extends AbstractIntegrationTest {

    private static final String ROTA = "/api/processos";
    private static final LocalDate HOJE = RelogioTesteConfig.HOJE;

    @MockitoBean
    private EmailService emailService;

    @Autowired
    private ApiTesteFixture fixture;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private String tokenAgente;

    @BeforeEach
    void preparar() {
        envioAceito();
        tokenAgente = fixture.tokenComCargo("agente.notificacao@itu.sp.gov.br", "Agente", "Notificacao",
                ApiTesteFixture.CARGO_AGENTE_SANITARIO_ID);
    }

    @Test
    @DisplayName("[T37] resultado negativo com desfecho: grava e devolve o desfecho; sem notificacao")
    void desfechoGravadoSemNotificar() {
        String processoId = processoAguardandoResultado(null);

        Response resposta = lancarResultado(processoId, corpoComDesfecho("negativo", "em_acompanhamento"));

        resposta.then().statusCode(200);
        assertThat(resposta.path("desfechoAnimal.codigo"), equalTo("em_acompanhamento"));
        assertThat(buscar(processoId).path("desfechoAnimal.codigo"), equalTo("em_acompanhamento"));
        semEnvio();
    }

    // DH-21 (docs/decisoes/T37.md): o desfecho e do processo e pode vir em
    // qualquer lancamento (original ou correcao), fora do historico imutavel.
    // A troca fica registrada na auditoria ATUALIZACAO de processo_sanitario
    // (antes e depois), nao em resultado_processo. Correcao SEM desfecho (manter
    // ou limpar o anterior) nao tem regra decidida e nao e testada aqui (T34-11).
    @Test
    @DisplayName("[T37/T34-11] desfecho no lancamento e na correcao: processo sobrescrito, auditoria com antes e depois")
    void desfechoNaCorrecaoSobrescritoEAuditado() {
        String processoId = processoAguardandoResultado(null);
        String originalId = lancarResultado(processoId, corpoComDesfecho("negativo", "em_acompanhamento"))
                .then().statusCode(200).extract().path("resultados[0].id");
        Map<String, Object> correcao = corpoComDesfecho("inconclusivo", "obito_natural");
        correcao.put("retificaId", originalId);

        lancarResultado(processoId, correcao).then().statusCode(200)
                .body("desfechoAnimal.codigo", equalTo("obito_natural"));

        assertThat(jdbcTemplate.queryForObject("SELECT d.codigo FROM processo_sanitario p"
                + " JOIN desfecho_animal d ON d.id = p.desfecho_animal_id WHERE p.id = CAST(? AS uuid)",
                String.class, processoId), equalTo("obito_natural"));
        assertThat(jdbcTemplate.queryForObject("SELECT count(*) FROM resultado_processo WHERE processo_id = CAST(? AS uuid)",
                Integer.class, processoId), equalTo(2));
        List<Map<String, Object>> eventos = jdbcTemplate.queryForList("SELECT payload_antes ->> 'desfechoAnimal' AS antes,"
                + " payload_depois ->> 'desfechoAnimal' AS depois FROM auditoria_evento"
                + " WHERE entidade = 'processo_sanitario' AND acao = 'ATUALIZACAO' AND entidade_id = CAST(? AS uuid)"
                + " AND payload_depois ->> 'resultado' IS NOT NULL ORDER BY ocorreu_em", processoId);
        assertThat(eventos, hasSize(2));
        assertThat(eventos.get(0).get("antes"), nullValue());
        assertThat(eventos.get(0).get("depois"), equalTo("em_acompanhamento"));
        assertThat(eventos.get(1).get("antes"), equalTo("em_acompanhamento"));
        assertThat(eventos.get(1).get("depois"), equalTo("obito_natural"));
    }

    @Test
    @DisplayName("[T37] desfecho com codigo inexistente: 422, nada gravado")
    void desfechoInvalidoRecusado() {
        String processoId = processoAguardandoResultado(null);

        lancarResultado(processoId, corpoComDesfecho("negativo", "nao_existe")).then().statusCode(422);

        assertThat(buscar(processoId).path("statusProcesso"), equalTo("AGUARDANDO_RESULTADO"));
    }

    @Test
    @DisplayName("[T37/regra 19] resultado positivo notifica o municipe (assincrono)")
    void positivoNotifica() {
        String processoId = processoAguardandoResultado("maria@exemplo.com");

        lancarResultado(processoId, corpoComDesfecho("positivo", null)).then().statusCode(200);

        envioAoMunicipe(processoId);
    }

    @Test
    @DisplayName("[T37/regra 19, revisao 2026-10-17] resultado inconclusivo NAO notifica mais")
    void inconclusivoNaoNotificaMais() {
        String processoId = processoAguardandoResultado("maria@exemplo.com");

        lancarResultado(processoId, corpoComDesfecho("inconclusivo", null)).then().statusCode(200);

        semEnvio();
    }

    @Test
    @DisplayName("[T37] correcao que faz o vigente PASSAR a positivo tambem notifica")
    void correcaoParaPositivoNotifica() {
        String processoId = processoAguardandoResultado("maria@exemplo.com");
        String originalId = lancarResultado(processoId, corpoComDesfecho("negativo", null))
                .then().statusCode(200).extract().path("resultados[0].id");
        envioAceito();

        Map<String, Object> correcao = corpoComDesfecho("positivo", null);
        correcao.put("retificaId", originalId);
        lancarResultado(processoId, correcao).then().statusCode(200);

        envioAoMunicipe(processoId);
    }

    // Desde a T35, a falha de SMTP chega como future falho (o EmailService
    // loga e nunca lanca); o lancamento do resultado nao depende dela.
    @Test
    @DisplayName("[T37] e-mail indisponivel: resultado e salvo mesmo assim, e a tentativa de envio aconteceu")
    void resultadoSalvoMesmoComFalhaDeEmail() {
        when(emailService.enviar(anyString(), anyString(), anyString(), anyString()))
                .thenReturn(CompletableFuture.failedFuture(new MailSendException("SMTP indisponivel")));
        String processoId = processoAguardandoResultado("maria@exemplo.com");

        Response resposta = lancarResultado(processoId, corpoComDesfecho("positivo", null));

        resposta.then().statusCode(200);
        assertThat(resposta.path("resultado.codigo"), equalTo("positivo"));
        envioAoMunicipe(processoId);
    }

    // ── Apoio ────────────────────────────────────────────

    // Mock sem stub devolveria null no lugar do future.
    private void envioAceito() {
        reset(emailService);
        when(emailService.enviar(anyString(), anyString(), anyString(), anyString()))
                .thenReturn(CompletableFuture.completedFuture(null));
    }

    // Notificacao ao responsavel cadastrado, com o protocolo no assunto e as
    // versoes HTML e texto do template (NotificacaoResultadoService).
    private void envioAoMunicipe(String processoId) {
        String protocolo = buscar(processoId).path("protocolo");
        verify(emailService, timeout(5000)).enviar(eq("maria@exemplo.com"), contains(protocolo), anyString(), anyString());
    }

    // O listener e @Async: a ausencia de chamada e conferida depois de uma espera.
    private void semEnvio() {
        verify(emailService, after(1000).never()).enviar(any(), any(), any(), any());
        verify(emailService, never()).enviar(any(), any(), any());
    }

    private String processoAguardandoResultado(String emailResponsavel) {
        Map<String, Object> corpo = fixture.corpoProcesso(null, false);
        if (emailResponsavel != null) {
            Map<String, Object> responsavel = new HashMap<>();
            responsavel.put("nome", "Maria Responsavel");
            responsavel.put("email", emailResponsavel);
            corpo.put("responsavel", responsavel);
        }
        String id = fixture.postarProcesso(tokenAgente, corpo).then().statusCode(200).extract().path("id");
        given().header("Authorization", "Bearer " + tokenAgente).contentType(ContentType.JSON)
                .body(Map.of("status", "AGUARDANDO_RESULTADO"))
                .when().patch(ROTA + "/" + id + "/status").then().statusCode(200);
        return id;
    }

    private Response lancarResultado(String processoId, Map<String, Object> corpo) {
        return given().header("Authorization", "Bearer " + tokenAgente).contentType(ContentType.JSON)
                .body(corpo)
                .when().post(ROTA + "/" + processoId + "/resultados");
    }

    private Response buscar(String processoId) {
        return given().header("Authorization", "Bearer " + tokenAgente).when().get(ROTA + "/" + processoId);
    }

    private static Map<String, Object> corpoComDesfecho(String resultado, String desfechoAnimal) {
        Map<String, Object> corpo = new HashMap<>();
        corpo.put("resultado", resultado);
        corpo.put("dataResultado", HOJE.toString());
        if (desfechoAnimal != null) {
            corpo.put("desfechoAnimal", desfechoAnimal);
        }
        return corpo;
    }
}
