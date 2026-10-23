package com.siszoo.comum.service;

import static java.util.concurrent.TimeUnit.MILLISECONDS;
import static java.util.concurrent.TimeUnit.SECONDS;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.arrayWithSize;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.equalToIgnoringCase;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.instanceOf;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.startsWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.RegisterExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;

import com.icegreen.greenmail.configuration.GreenMailConfiguration;
import com.icegreen.greenmail.junit5.GreenMailExtension;
import com.icegreen.greenmail.util.ServerSetupTest;
import com.siszoo.comum.AbstractIntegrationTest;

import ch.qos.logback.classic.Level;
import jakarta.mail.Message;
import jakarta.mail.Part;
import jakarta.mail.internet.ContentType;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.internet.MimeMultipart;

// T35: EmailService no contexto real (application.yml, AsyncConfig, mail e
// Thymeleaf auto-configurados) contra o SMTP falso do GreenMail — nenhum
// servidor externo, nenhum endereco real (so .test). O GreenMail sobe uma vez
// por classe numa porta livre (dynamicPort), antes do contexto Spring, que le
// a porta pelo @DynamicPropertySource; reiniciar por metodo trocaria a porta
// sob o contexto em cache.
class EmailServiceIT extends AbstractIntegrationTest {

    @RegisterExtension
    static final GreenMailExtension GREEN_MAIL = new GreenMailExtension(ServerSetupTest.SMTP.dynamicPort())
            .withConfiguration(GreenMailConfiguration.aConfig().withDisabledAuthentication())
            .withPerMethodLifecycle(false);

    @DynamicPropertySource
    static void smtpDoGreenMail(DynamicPropertyRegistry registro) {
        registro.add("spring.mail.host", () -> GREEN_MAIL.getSmtp().getBindTo());
        registro.add("spring.mail.port", () -> GREEN_MAIL.getSmtp().getPort());
    }

    private static final String DESTINATARIO = "municipe@siszoo.test";
    private static final String REMETENTE = "nao-responda@siszoo.test";
    private static final long ESPERA_MS = 5000;

    // Espiao do JavaMailSender real: so o teste de assincronia muda o
    // comportamento; nos demais, delega ao send real (reset apos cada teste).
    @MockitoSpyBean
    private JavaMailSender mailSender;

    @Autowired
    private EmailService emailService;

    @Autowired
    private EmailTemplateService emailTemplateService;

    private LogCapturado log;

    @BeforeEach
    void preparar() throws Exception {
        GREEN_MAIL.purgeEmailFromAllMailboxes();
        log = LogCapturado.de(EmailService.class);
    }

    @AfterEach
    void soltarLog() {
        log.close();
    }

    @Test
    @DisplayName("[T35] envio com texto: GreenMail recebe multipart/alternative com destinatario, assunto e remetente")
    void enviaTextoEHtmlComoAlternativas() throws Exception {
        emailService.enviar(DESTINATARIO, "Notificação de teste", "<p>Olá, <b>munícipe</b></p>", "Olá, munícipe")
                .get(ESPERA_MS, MILLISECONDS);

        MimeMessage recebida = unicaRecebida();
        assertThat(((InternetAddress) recebida.getRecipients(Message.RecipientType.TO)[0]).getAddress(),
                equalTo(DESTINATARIO));
        assertThat(((InternetAddress) recebida.getFrom()[0]).getAddress(), equalTo(REMETENTE));
        assertThat(recebida.getSubject(), equalTo("Notificação de teste"));
        assertThat(tipo(recebida).match("multipart/alternative"), is(true));

        MimeMultipart partes = (MimeMultipart) recebida.getContent();
        assertThat(partes.getCount(), equalTo(2));
        assertTexto(partes.getBodyPart(0), "text/plain", "Olá, munícipe");
        assertTexto(partes.getBodyPart(1), "text/html", "<p>Olá, <b>munícipe</b></p>");
    }

    @Test
    @DisplayName("[T35] assinatura da issue (so HTML): parte unica text/html em UTF-8")
    void enviaSoHtml() throws Exception {
        emailService.enviar(DESTINATARIO, "Somente HTML", "<p>Conteúdo em HTML</p>")
                .get(ESPERA_MS, MILLISECONDS);

        MimeMessage recebida = unicaRecebida();
        assertTexto(recebida, "text/html", "<p>Conteúdo em HTML</p>");
    }

    // Template da notificacao de resultado (T36) com dado dinamico hostil: o
    // HTML chega escapado; o texto puro leva o valor literal (nao e HTML).
    @Test
    @DisplayName("[T35] template Thymeleaf: dados dinamicos renderizados e HTML escapado")
    void enviaTemplateRenderizado() throws Exception {
        Map<String, Object> variaveis = new HashMap<>();
        variaveis.put("nome", "<script>alert(1)</script> Ana");
        variaveis.put("protocolo", "007/2026");
        variaveis.put("resultado", "positivo");
        String html = emailTemplateService.renderizarHtml("email/resultado-processo", variaveis);
        String texto = emailTemplateService.renderizarTexto("email/resultado-processo", variaveis);

        // Quebras normalizadas: com core.autocrlf, o .txt pode estar em CRLF
        // num checkout Windows (inofensivo no e-mail, que trafega em CRLF).
        assertThat(texto.replace("\r\n", "\n"), equalTo("Ola, <script>alert(1)</script> Ana.\n\n"
                + "O resultado laboratorial do processo sanitario 007/2026 foi registrado como positivo pelo Centro de Controle de Zoonoses de Itu.\n"
                + "Entre em contato com o CCZ para mais informacoes.\n\n"
                + "CCZ \"Sao Francisco de Assis\"\n"
                + "Avenida Sete Quedas, 1038 - Vila Progresso\n"
                + "Fone: (11) 4023-1505 / WhatsApp: (11) 93231-9925\n"
                + "Segunda a sexta, das 8h as 17h\n"));

        emailService.enviar(DESTINATARIO, "Resultado 007/2026", html, texto)
                .get(ESPERA_MS, MILLISECONDS);

        MimeMultipart partes = (MimeMultipart) unicaRecebida().getContent();
        String htmlRecebido = (String) partes.getBodyPart(1).getContent();
        assertThat(htmlRecebido, containsString("&lt;script&gt;alert(1)&lt;/script&gt; Ana"));
        assertThat(htmlRecebido, not(containsString("<script>")));
        assertThat(htmlRecebido, containsString("<strong>007/2026</strong>"));
        assertThat(htmlRecebido, containsString("<meta charset=\"UTF-8\">"));
        // Comentarios de parser do template nao chegam ao destinatario.
        assertThat(htmlRecebido, not(containsString("NAO e comunicacao oficial")));
        assertThat((String) partes.getBodyPart(0).getContent(), not(containsString("T35")));
    }

    // Sem sleep: o envio fica preso num latch dentro do send. Enquanto preso,
    // quem chamou ja tem o future de volta, ainda pendente, e o send roda numa
    // thread do executor do @EnableAsync (prefixo do application.yml).
    @Test
    @DisplayName("[T35] envio assincrono: devolve o future antes do send terminar, em thread siszoo-async-")
    void envioNaoBloqueiaQuemChama() throws Exception {
        CountDownLatch entrou = new CountDownLatch(1);
        CountDownLatch liberar = new CountDownLatch(1);
        AtomicReference<String> threadDoEnvio = new AtomicReference<>();
        doAnswer(chamada -> {
            threadDoEnvio.set(Thread.currentThread().getName());
            entrou.countDown();
            if (!liberar.await(5, SECONDS)) {
                throw new IllegalStateException("teste nao liberou o envio");
            }
            return chamada.callRealMethod();
        }).when(mailSender).send(any(MimeMessage.class));

        CompletableFuture<Void> envio = emailService.enviar(DESTINATARIO, "Assincrono", "<p>corpo</p>");

        assertThat(entrou.await(5, SECONDS), is(true));
        assertThat(envio.isDone(), is(false));
        assertThat(threadDoEnvio.get(), startsWith("siszoo-async-"));
        assertThat(threadDoEnvio.get(), not(equalTo(Thread.currentThread().getName())));
        assertThat(GREEN_MAIL.getReceivedMessages(), arrayWithSize(0));

        liberar.countDown();
        envio.get(ESPERA_MS, MILLISECONDS);
        assertThat(GREEN_MAIL.waitForIncomingEmail(ESPERA_MS, 1), is(true));
    }

    @Test
    @DisplayName("[T35] log de sucesso: so depois do envio, destinatario mascarado, sem assunto nem corpo")
    void logDeSucessoSemDadosPessoais() throws Exception {
        emailService.enviar(DESTINATARIO, "Assunto confidencial", "<p>Corpo confidencial</p>", "Corpo confidencial")
                .get(ESPERA_MS, MILLISECONDS);

        assertThat(GREEN_MAIL.getReceivedMessages(), arrayWithSize(1));
        assertThat(log.textos(Level.INFO), hasSize(1));
        assertThat(log.textos(Level.INFO).get(0), containsString("m***@siszoo.test"));
        assertThat(log.textos(Level.INFO).get(0), containsString("Message-ID <"));
        assertThat(log.eventos(), hasSize(1));
        assertThat(log.textos(Level.INFO), everyItem(not(containsString(DESTINATARIO))));
        assertThat(log.textos(Level.INFO), everyItem(not(containsString("confidencial"))));
    }

    private static MimeMessage unicaRecebida() {
        assertThat(GREEN_MAIL.waitForIncomingEmail(ESPERA_MS, 1), is(true));
        MimeMessage[] recebidas = GREEN_MAIL.getReceivedMessages();
        assertThat(recebidas, arrayWithSize(1));
        return recebidas[0];
    }

    private static ContentType tipo(Part parte) throws Exception {
        return new ContentType(parte.getContentType());
    }

    // Content-Type pelo parse (o MimeMessageHelper grava "text/html;charset=UTF-8",
    // sem espaco), e o conteudo ja decodificado pelo Jakarta Mail.
    private static void assertTexto(Part parte, String mime, String conteudo) throws Exception {
        ContentType tipo = tipo(parte);
        assertThat(parte.getContentType(), tipo.match(mime), is(true));
        assertThat(tipo.getParameter("charset"), equalToIgnoringCase("UTF-8"));
        assertThat(parte.getContent(), instanceOf(String.class));
        assertThat(((String) parte.getContent()).trim(), equalTo(conteudo));
    }
}
