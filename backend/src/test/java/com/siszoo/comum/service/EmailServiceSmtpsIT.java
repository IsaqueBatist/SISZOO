package com.siszoo.comum.service;

import static java.util.concurrent.TimeUnit.SECONDS;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.arrayWithSize;
import static org.hamcrest.Matchers.equalTo;
import static org.hamcrest.Matchers.instanceOf;
import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.Properties;
import java.util.concurrent.ExecutionException;

import javax.net.ssl.SSLException;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.RegisterExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import com.icegreen.greenmail.configuration.GreenMailConfiguration;
import com.icegreen.greenmail.junit5.GreenMailExtension;
import com.icegreen.greenmail.util.ServerSetupTest;
import com.siszoo.comum.AbstractIntegrationTest;

import jakarta.mail.Message;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;

// T35-20: SMTPS (TLS implicito, porta 465 em producao) com o GreenMail em
// SMTPS. So o servidor SMTPS do GreenMail esta no ar: uma mensagem recebida
// prova que a conexao foi TLS desde o inicio (sem STARTTLS).
//
// O GreenMail usa um certificado autoassinado, que nenhum truststore conhece.
// So neste teste, ssl.trust e checkserveridentity=false aceitam esse
// certificado; o application.yml nao tem nada disso, e em producao a cadeia
// e o nome do host sao validados (padrao do Angus 2.0.5). O segundo teste
// mostra que, sem essa excecao, o mesmo certificado e recusado.
class EmailServiceSmtpsIT extends AbstractIntegrationTest {

    @RegisterExtension
    static final GreenMailExtension GREEN_MAIL = new GreenMailExtension(ServerSetupTest.SMTPS.dynamicPort())
            .withConfiguration(GreenMailConfiguration.aConfig().withDisabledAuthentication())
            .withPerMethodLifecycle(false);

    @DynamicPropertySource
    static void smtpsDoGreenMail(DynamicPropertyRegistry registro) {
        registro.add("spring.mail.host", () -> GREEN_MAIL.getSmtps().getBindTo());
        registro.add("spring.mail.port", () -> GREEN_MAIL.getSmtps().getPort());
        // O mesmo que SMTP_SSL=true no ambiente.
        registro.add("spring.mail.properties.mail.smtp.ssl.enable", () -> "true");
        registro.add("spring.mail.properties.mail.smtp.ssl.trust", () -> "*");
        registro.add("spring.mail.properties.mail.smtp.ssl.checkserveridentity", () -> "false");
    }

    private static final String DESTINATARIO = "municipe.smtps@siszoo.test";

    @Autowired
    private EmailService emailService;

    @BeforeEach
    void limparCaixas() throws Exception {
        GREEN_MAIL.purgeEmailFromAllMailboxes();
    }

    @Test
    @DisplayName("[T35-20] SMTPS: envio pelo contexto real chega ao GreenMail em SMTPS")
    void enviaPorSmtps() throws Exception {
        emailService.enviar(DESTINATARIO, "Teste SMTPS", "<p>via SMTPS</p>", "via SMTPS").get(10, SECONDS);

        assertThat(GREEN_MAIL.waitForIncomingEmail(5000, 1), is(true));
        MimeMessage[] recebidas = GREEN_MAIL.getReceivedMessages();
        assertThat(recebidas, arrayWithSize(1));
        assertThat(((InternetAddress) recebidas[0].getRecipients(Message.RecipientType.TO)[0]).getAddress(),
                equalTo(DESTINATARIO));
        assertThat(recebidas[0].getSubject(), equalTo("Teste SMTPS"));
    }

    // Sem a excecao do teste (truststore padrao), o certificado autoassinado
    // e recusado no handshake: o envio falha e nada chega.
    @Test
    @DisplayName("[T35-20] SMTPS valida o certificado: autoassinado sem confianca explicita e recusado")
    void certificadoNaoConfiavelERecusado() {
        JavaMailSenderImpl semConfianca = new JavaMailSenderImpl();
        semConfianca.setHost(GREEN_MAIL.getSmtps().getBindTo());
        semConfianca.setPort(GREEN_MAIL.getSmtps().getPort());
        Properties propriedades = new Properties();
        propriedades.put("mail.smtp.ssl.enable", "true");
        propriedades.put("mail.smtp.connectiontimeout", "5000");
        propriedades.put("mail.smtp.timeout", "5000");
        semConfianca.setJavaMailProperties(propriedades);

        EmailService servico = new EmailService(semConfianca, "nao-responda@siszoo.test");
        ExecutionException falha = assertThrows(ExecutionException.class,
                () -> servico.enviar(DESTINATARIO, "Nao deve sair", "<p>x</p>").get(10, SECONDS));

        assertThat(falha.getCause(), instanceOf(MailSendException.class));
        assertThat(temCausa(falha.getCause(), SSLException.class), is(true));
        assertThat(GREEN_MAIL.getReceivedMessages(), arrayWithSize(0));
    }

    // MailSendException guarda a causa por mensagem em getMessageExceptions().
    private static boolean temCausa(Throwable erro, Class<? extends Throwable> tipo) {
        for (Throwable atual = erro; atual != null; atual = atual.getCause()) {
            if (tipo.isInstance(atual)) {
                return true;
            }
            if (atual instanceof MailSendException envio) {
                for (Exception porMensagem : envio.getMessageExceptions()) {
                    if (temCausa(porMensagem, tipo)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
}
