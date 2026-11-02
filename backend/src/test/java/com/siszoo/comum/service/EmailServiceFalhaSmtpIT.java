package com.siszoo.comum.service;

import static java.util.concurrent.TimeUnit.SECONDS;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.empty;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.instanceOf;
import static org.hamcrest.Matchers.not;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.MailSendException;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import com.siszoo.comum.AbstractIntegrationTest;

import ch.qos.logback.classic.Level;

class EmailServiceFalhaSmtpIT extends AbstractIntegrationTest {

    private static final int PORTA_FECHADA = portaLivre();
    private static final String DESTINATARIO = "municipe@siszoo.test";

    @DynamicPropertySource
    static void smtpInexistente(DynamicPropertyRegistry registro) {
        registro.add("spring.mail.host", () -> "127.0.0.1");
        registro.add("spring.mail.port", () -> PORTA_FECHADA);
    }

    @Autowired
    private EmailService emailService;

    @Test
    @DisplayName("[T35] SMTP indisponivel: quem chama nao recebe excecao; future falha e o WARN nao traz o endereco")
    void falhaDeConexaoViraFutureFalhoELogSeguro() {
        try (LogCapturado log = LogCapturado.de(EmailService.class)) {
            CompletableFuture<Void> envio = emailService.enviar(DESTINATARIO, "Assunto", "<p>corpo</p>", null);

            ExecutionException falha = assertThrows(ExecutionException.class, () -> envio.get(15, SECONDS));
            assertThat(falha.getCause(), instanceOf(MailSendException.class));

            assertThat(log.textos(Level.WARN), hasSize(1));
            String aviso = log.textos(Level.WARN).get(0);
            assertThat(aviso, containsString("m***@siszoo.test"));
            assertThat(aviso, containsString("MailSendException"));
            assertThat(aviso, not(containsString(DESTINATARIO)));
            assertThat(log.doNivel(Level.DEBUG), hasSize(1));
            assertThat(log.textos(Level.INFO), empty());
        }
    }

    private static int portaLivre() {
        try (ServerSocket socket = new ServerSocket(0, 1, InetAddress.getLoopbackAddress())) {
            return socket.getLocalPort();
        } catch (IOException ex) {
            throw new UncheckedIOException(ex);
        }
    }
}
