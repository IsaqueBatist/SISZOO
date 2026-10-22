package com.siszoo.processos;

import static io.restassured.RestAssured.given;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.arrayWithSize;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.notNullValue;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.LockSupport;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.RegisterExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import com.icegreen.greenmail.configuration.GreenMailConfiguration;
import com.icegreen.greenmail.junit5.GreenMailExtension;
import com.icegreen.greenmail.util.ServerSetupTest;
import com.siszoo.comum.AbstractIntegrationTest;
import com.siszoo.comum.ApiTesteFixture;

import io.restassured.http.ContentType;
import io.restassured.response.Response;
import jakarta.mail.Message;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.internet.MimeMultipart;

// T35 (auditoria): a notificacao da T36 de ponta a ponta, sem mock no envio —
// POST do resultado positivo -> commit -> listener AFTER_COMMIT ->
// NotificacaoResultadoService -> templates reais -> EmailService -> SMTP falso
// do GreenMail -> data/hora gravada no processo (T35-16). E o positivo
// definitivo (T35-15): a tentativa de corrigir nao gera segunda mensagem.
class NotificacaoResultadoEmailIT extends AbstractIntegrationTest {

    @RegisterExtension
    static final GreenMailExtension GREEN_MAIL = new GreenMailExtension(ServerSetupTest.SMTP.dynamicPort())
            .withConfiguration(GreenMailConfiguration.aConfig().withDisabledAuthentication())
            .withPerMethodLifecycle(false);

    @DynamicPropertySource
    static void smtpDoGreenMail(DynamicPropertyRegistry registro) {
        registro.add("spring.mail.host", () -> GREEN_MAIL.getSmtp().getBindTo());
        registro.add("spring.mail.port", () -> GREEN_MAIL.getSmtp().getPort());
    }

    private static final String DESTINATARIO = "municipe.notificacao@siszoo.test";
    private static final long ESPERA_MS = 5000;

    @Autowired
    private ApiTesteFixture fixture;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private String token;

    @BeforeEach
    void preparar() throws Exception {
        GREEN_MAIL.purgeEmailFromAllMailboxes();
        token = fixture.tokenComCargo("agente.email.notificacao@itu.sp.gov.br", "Agente", "EmailNotificacao",
                ApiTesteFixture.CARGO_AGENTE_SANITARIO_ID);
    }

    @Test
    @DisplayName("[T35/T36] positivo: GreenMail recebe uma notificacao com o texto da T36, nome escapado e data gravada")
    void positivoChegaAoSmtpEGravaAData() throws Exception {
        String processoId = processoAguardandoResultado("<b>Ana</b> Responsavel");
        String protocolo = buscar(processoId).path("protocolo");

        // 200 = commit do resultado; so depois disso o envio pode acontecer.
        lancarResultado(processoId, corpo("positivo", null)).then().statusCode(200);

        assertThat(GREEN_MAIL.waitForIncomingEmail(ESPERA_MS, 1), is(true));
        MimeMessage[] recebidas = GREEN_MAIL.getReceivedMessages();
        assertThat(recebidas, arrayWithSize(1));
        MimeMessage mensagem = recebidas[0];
        assertThat(((InternetAddress) mensagem.getRecipients(Message.RecipientType.TO)[0]).getAddress(),
                equalTo(DESTINATARIO));
        assertThat(mensagem.getSubject(), equalTo("SISZOO — Resultado do processo sanitario " + protocolo));
        assertThat(new jakarta.mail.internet.ContentType(mensagem.getContentType()).match("multipart/alternative"),
                is(true));

        MimeMultipart partes = (MimeMultipart) mensagem.getContent();
        String texto = ((String) partes.getBodyPart(0).getContent()).replace("\r\n", "\n");
        String html = (String) partes.getBodyPart(1).getContent();
        assertThat(texto, equalTo("Ola, <b>Ana</b> Responsavel.\n\n"
                + "O resultado laboratorial do processo sanitario " + protocolo
                + " foi registrado como positivo pelo Centro de Controle de Zoonoses de Itu.\n"
                + "Entre em contato com o CCZ para mais informacoes.\n\n"
                + "CCZ \"Sao Francisco de Assis\"\n"
                + "Avenida Sete Quedas, 1038 - Vila Progresso\n"
                + "Fone: (11) 4023-1505 / WhatsApp: (11) 93231-9925\n"
                + "Segunda a sexta, das 8h as 17h\n"));
        assertThat(html, containsString("Ola, <span>&lt;b&gt;Ana&lt;/b&gt; Responsavel</span>."));
        assertThat(html, not(containsString("<b>Ana</b>")));
        assertThat(html, containsString("<strong>" + protocolo + "</strong>"));

        assertThat(aguardarDataNotificacao(processoId), notNullValue());
    }

    @Test
    @DisplayName("[T35-15] positivo notificado e definitivo: correcao 422 e nenhuma segunda mensagem")
    void positivoNotificadoNaoGeraSegundaMensagem() throws Exception {
        String processoId = processoAguardandoResultado("Ana Responsavel");
        String positivoId = lancarResultado(processoId, corpo("positivo", null))
                .then().statusCode(200).extract().path("resultados[0].id");
        assertThat(GREEN_MAIL.waitForIncomingEmail(ESPERA_MS, 1), is(true));
        LocalDateTime gravada = aguardarDataNotificacao(processoId);

        lancarResultado(processoId, corpo("negativo", positivoId)).then().statusCode(422);
        lancarResultado(processoId, corpo("positivo", positivoId)).then().statusCode(422);

        // Ausencia so com espera: uma segunda mensagem teria 1 s para chegar.
        assertThat(GREEN_MAIL.waitForIncomingEmail(1000, 2), is(false));
        assertThat(GREEN_MAIL.getReceivedMessages(), arrayWithSize(1));
        assertThat(dataNotificacao(processoId), equalTo(gravada));
    }

    // ── Apoio ────────────────────────────────────────────

    private String processoAguardandoResultado(String nomeResponsavel) {
        Map<String, Object> corpo = fixture.corpoProcesso(null, false);
        Map<String, Object> responsavel = new HashMap<>();
        responsavel.put("nome", nomeResponsavel);
        responsavel.put("email", DESTINATARIO);
        corpo.put("responsavel", responsavel);
        String id = fixture.postarProcesso(token, corpo).then().statusCode(200).extract().path("id");
        given().header("Authorization", "Bearer " + token).contentType(ContentType.JSON)
                .body(Map.of("status", "AGUARDANDO_RESULTADO"))
                .when().patch("/api/processos/" + id + "/status").then().statusCode(200);
        return id;
    }

    private Map<String, Object> corpo(String resultado, String retificaId) {
        Map<String, Object> corpo = new HashMap<>();
        corpo.put("resultado", resultado);
        corpo.put("dataResultado", fixture.hoje().toString());
        if (retificaId != null) {
            corpo.put("retificaId", retificaId);
        }
        return corpo;
    }

    private Response lancarResultado(String processoId, Map<String, Object> corpo) {
        return given().header("Authorization", "Bearer " + token).contentType(ContentType.JSON)
                .body(corpo).when().post("/api/processos/" + processoId + "/resultados");
    }

    private Response buscar(String processoId) {
        return given().header("Authorization", "Bearer " + token).when().get("/api/processos/" + processoId);
    }

    private LocalDateTime dataNotificacao(String processoId) {
        return jdbcTemplate.queryForObject("SELECT data_notificacao_municipe FROM processo_sanitario"
                + " WHERE id = CAST(? AS uuid)", LocalDateTime.class, processoId);
    }

    // A data e gravada no callback do envio, em outra thread: espera pela
    // condicao, com prazo (nao um sleep fixo).
    private LocalDateTime aguardarDataNotificacao(String processoId) {
        long limite = System.nanoTime() + TimeUnit.MILLISECONDS.toNanos(ESPERA_MS);
        LocalDateTime data = dataNotificacao(processoId);
        while (data == null && System.nanoTime() < limite) {
            LockSupport.parkNanos(TimeUnit.MILLISECONDS.toNanos(50));
            data = dataNotificacao(processoId);
        }
        return data;
    }
}
