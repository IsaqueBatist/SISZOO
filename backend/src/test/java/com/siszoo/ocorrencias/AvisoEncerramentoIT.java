package com.siszoo.ocorrencias;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.allOf;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.not;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.after;
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
import org.mockito.ArgumentCaptor;
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
import io.restassured.specification.RequestSpecification;

@Import(RelogioTesteConfig.class)
class AvisoEncerramentoIT extends AbstractIntegrationTest {

    private static final String ROTA = "/api/ocorrencias";
    private static final LocalDate HOJE = RelogioTesteConfig.HOJE;
    private static final String EMAIL = "denunciante.aviso@exemplo.com";

    @MockitoBean
    private EmailService emailService;

    @Autowired
    private ApiTesteFixture fixture;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private String tokenAgente;

    @BeforeEach
    void preparar() {
        reset(emailService);
        when(emailService.enviar(anyString(), anyString(), anyString(), anyString()))
                .thenReturn(CompletableFuture.completedFuture(null));
        tokenAgente = fixture.tokenComCargo("agente.aviso.encerramento@itu.sp.gov.br", "Agente", "AvisoEncerramento",
                ApiTesteFixture.CARGO_AGENTE_SANITARIO_ID);
    }

    @Test
    @DisplayName("encerrar ocorrencia identificada envia protocolo e providencia, sem dados de terceiros nem a denuncia")
    void avisoSemDadosDeTerceiros() {
        String id = criarEEncerrar(corpo(false, EMAIL));
        String protocolo = protocolo(id);

        ArgumentCaptor<String> html = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> texto = ArgumentCaptor.forClass(String.class);
        verify(emailService, timeout(5000)).enviar(eq(EMAIL), eq("SISZOO - Ocorrência " + protocolo + " encerrada"),
                html.capture(), texto.capture());
        for (String corpo : List.of(html.getValue(), texto.getValue())) {
            assertThat(corpo, allOf(containsString(protocolo), containsString("Captura e remoção"),
                    containsString("10/09/2026"), not(containsString("Rua das Acacias")),
                    not(containsString("Vizinho Denunciado")), not(containsString("Cao preso sem agua"))));
        }
        assertThat(aguardarResultadoAuditado(id), equalTo("ENVIADO"));
    }

    @Test
    @DisplayName("ocorrencia anonima nao envia aviso")
    void anonimaNaoEnvia() {
        criarEEncerrar(corpo(true, null));

        verify(emailService, after(1500).never()).enviar(anyString(), anyString(), anyString(), anyString());
    }

    @Test
    @DisplayName("falha de SMTP nao impede o encerramento e fica auditada")
    void falhaDeSmtpNaoImpedeEncerramento() {
        when(emailService.enviar(anyString(), anyString(), anyString(), anyString()))
                .thenReturn(CompletableFuture.failedFuture(new MailSendException("SMTP indisponivel")));

        String id = criarEEncerrar(corpo(false, EMAIL));

        comToken().when().get(ROTA + "/" + id).then().statusCode(200).body("statusOcorrencia", equalTo("ENCERRADA"));
        assertThat(aguardarResultadoAuditado(id), equalTo("FALHA"));
    }

    private String criarEEncerrar(Map<String, Object> corpo) {
        String id = comToken().contentType(ContentType.JSON).body(corpo).when().post(ROTA)
                .then().statusCode(200).extract().path("id");
        comToken().contentType(ContentType.JSON).body(Map.of("status", "EM_ATENDIMENTO"))
                .when().patch(ROTA + "/" + id + "/status").then().statusCode(200);
        comToken().contentType(ContentType.JSON).body(Map.of("providenciaTomada", "captura_remocao"))
                .when().post(ROTA + "/" + id + "/encerramento").then().statusCode(200);
        return id;
    }

    private String protocolo(String id) {
        return comToken().when().get(ROTA + "/" + id).then().statusCode(200).extract().path("protocolo");
    }

    private String aguardarResultadoAuditado(String id) {
        for (int tentativa = 0; tentativa < 50; tentativa++) {
            List<String> resultados = jdbcTemplate.queryForList(
                    "SELECT payload_depois ->> 'resultado' FROM auditoria_evento WHERE acao = 'NOTIFICACAO'"
                            + " AND entidade = 'aviso_encerramento_ocorrencia' AND entidade_id = CAST(? AS uuid)",
                    String.class, id);
            if (!resultados.isEmpty()) {
                return resultados.get(0);
            }
            try {
                Thread.sleep(100);
            } catch (InterruptedException ex) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException(ex);
            }
        }
        throw new AssertionError("Resultado do aviso de encerramento nao foi auditado para " + id);
    }

    private Map<String, Object> corpo(boolean anonima, String email) {
        Map<String, Object> corpo = new HashMap<>();
        corpo.put("tipoOcorrencia", "zoonose");
        corpo.put("dataAbertura", HOJE.toString());
        corpo.put("endereco", "Rua das Acacias, 145");
        corpo.put("bairro", "Vila Esperanca");
        corpo.put("descricao", "Cao preso sem agua");
        corpo.put("urgente", false);
        corpo.put("sigilosa", false);
        corpo.put("anonima", anonima);
        if (!anonima) {
            corpo.put("denunciante", Map.of("nome", "Maria Teste", "email", email));
        }
        corpo.put("denunciado", Map.of("nome", "Vizinho Denunciado"));
        return corpo;
    }

    private RequestSpecification comToken() {
        return given().header("Authorization", "Bearer " + tokenAgente);
    }
}
