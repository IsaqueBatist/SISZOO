package com.siszoo.comum.service;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.empty;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.instanceOf;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Properties;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;

import ch.qos.logback.classic.Level;
import jakarta.mail.Session;
import jakarta.mail.internet.MimeMessage;

// T35: ramos do EmailService chamados direto, sem Spring e sem proxy @Async
// (o envio real, o template e a thread assincrona estao no EmailServiceIT;
// a falha real de SMTP, no EmailServiceFalhaSmtpIT). Endereco so em .test.
@ExtendWith(MockitoExtension.class)
class EmailServiceTest {

    private static final String DESTINATARIO = "municipe@siszoo.test";
    private static final String ASSUNTO = "Assunto de teste";

    @Mock
    private JavaMailSender mailSender;

    private EmailService service;
    private LogCapturado log;

    @BeforeEach
    void preparar() {
        service = new EmailService(mailSender, "nao-responda@siszoo.test");
        log = LogCapturado.de(EmailService.class);
    }

    @AfterEach
    void soltarLog() {
        log.close();
    }

    @Test
    void envioAceitoCompletaOFutureELogaSoODestinatarioMascarado() {
        // Mock de JavaMailSender devolve null em createMimeMessage(); sem o
        // send real, o Message-ID fica nulo, e o log tem que aceitar isso.
        mensagemVazia();

        CompletableFuture<Void> envio = service.enviar(DESTINATARIO, ASSUNTO, "<p>corpo secreto</p>", "corpo secreto");

        assertThat(envio.isDone(), is(true));
        assertThat(envio.isCompletedExceptionally(), is(false));
        verify(mailSender).send(any(MimeMessage.class));
        assertThat(log.textos(Level.INFO), hasSize(1));
        assertThat(log.textos(Level.INFO).get(0), containsString("m***@siszoo.test"));
        assertThat(log.textos(Level.INFO).get(0), containsString("Message-ID null"));
        assertThat(log.textos(Level.WARN), empty());
        semDadosNoLog(Level.INFO, "corpo secreto");
    }

    @Test
    void destinatarioEmBrancoViraFutureFalhoSemTentarEnviar() {
        CompletableFuture<Void> envio = service.enviar("  ", ASSUNTO, "<p>corpo</p>");

        ExecutionException falha = assertThrows(ExecutionException.class, envio::get);
        assertThat(falha.getCause(), instanceOf(IllegalArgumentException.class));
        verify(mailSender, never()).send(any(MimeMessage.class));
        assertThat(log.textos(Level.WARN), hasSize(1));
        assertThat(log.textos(Level.WARN).get(0), containsString("(vazio)"));
        assertThat(log.textos(Level.INFO), empty());
    }

    @Test
    void assuntoEmBrancoViraFutureFalhoSemTentarEnviar() {
        CompletableFuture<Void> envio = service.enviar(DESTINATARIO, "", "<p>corpo</p>");

        ExecutionException falha = assertThrows(ExecutionException.class, envio::get);
        assertThat(falha.getCause(), instanceOf(IllegalArgumentException.class));
        verify(mailSender, never()).send(any(MimeMessage.class));
        assertThat(log.textos(Level.INFO), empty());
    }

    // LGPD: a mensagem de um erro SMTP pode repetir o endereco (ex.: 550 com
    // o destinatario). O WARN so leva as classes; o detalhe fica no DEBUG.
    @Test
    void falhaDoSmtpViraFutureFalhoEOWarnNaoRepeteOEndereco() {
        mensagemVazia();
        MailSendException erro = new MailSendException("550 5.1.1 <" + DESTINATARIO + ">: usuario desconhecido");
        doThrow(erro).when(mailSender).send(any(MimeMessage.class));

        CompletableFuture<Void> envio = service.enviar(DESTINATARIO, ASSUNTO, "<p>corpo</p>");

        ExecutionException falha = assertThrows(ExecutionException.class, envio::get);
        assertThat(falha.getCause(), is(erro));
        assertThat(log.textos(Level.WARN), hasSize(1));
        assertThat(log.textos(Level.WARN).get(0), containsString("MailSendException"));
        assertThat(log.textos(Level.WARN).get(0), containsString("m***@siszoo.test"));
        semDadosNoLog(Level.WARN, ASSUNTO);
        assertThat(log.doNivel(Level.DEBUG), hasSize(1));
        assertThat(log.textos(Level.DEBUG).get(0), containsString(DESTINATARIO));
        assertThat(log.textos(Level.INFO), empty());
    }

    @Test
    void remetenteEmBrancoImpedeCriarOServico() {
        IllegalStateException erro = assertThrows(IllegalStateException.class,
                () -> new EmailService(mailSender, " "));
        assertThat(erro.getMessage(), containsString("SISZOO_MAIL_FROM"));
    }

    @ParameterizedTest
    @CsvSource(value = {
            "NULO, (vazio)",
            "'', (vazio)",
            "'   ', (vazio)",
            "sem-arroba, ***",
            "@siszoo.test, ***",
            "fulano@, ***",
            "a@siszoo.test, *@siszoo.test",
            "maria@siszoo.test, m***@siszoo.test",
            "'  maria@siszoo.test  ', m***@siszoo.test"
    }, nullValues = "NULO")
    void mascaraODestinatario(String email, String esperado) {
        assertThat(EmailService.mascarar(email), equalTo(esperado));
    }

    private void mensagemVazia() {
        when(mailSender.createMimeMessage()).thenReturn(new MimeMessage(Session.getInstance(new Properties())));
    }

    // Nenhum evento do nivel traz o endereco completo nem o trecho informado.
    private void semDadosNoLog(Level nivel, String trecho) {
        assertThat(log.textos(nivel), everyItem(not(containsString(DESTINATARIO))));
        assertThat(log.textos(nivel), everyItem(not(containsString(trecho))));
    }
}
