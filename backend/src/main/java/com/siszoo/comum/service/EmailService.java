package com.siszoo.comum.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.IdentityHashMap;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailPreparationException;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeBodyPart;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.internet.MimeMultipart;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private static final String CHARSET = "UTF-8";

    private final JavaMailSender mailSender;
    private final String remetente;

    public EmailService(JavaMailSender mailSender,
            @Value("${siszoo.notificacoes.remetente:}") String remetente) {
        if (!StringUtils.hasText(remetente)) {
            throw new IllegalStateException(
                    "siszoo.notificacoes.remetente (SISZOO_MAIL_FROM) ausente: remetente obrigatorio para enviar e-mail");
        }
        this.mailSender = mailSender;
        this.remetente = remetente.trim();
    }

    @Async
    public CompletableFuture<Void> enviar(String destinatario, String assunto, String corpoHtml, String corpoTexto) {
        String idEnvio = UUID.randomUUID().toString().substring(0, 8);
        String destinoMascarado = mascarar(destinatario);
        try {
            exigirTexto(destinatario, "destinatario");
            exigirTexto(assunto, "assunto");
            exigirTexto(corpoHtml, "corpoHtml");

            MimeMessage mensagem = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mensagem, false, CHARSET);
            helper.setFrom(remetente);
            helper.setTo(destinatario.trim());
            helper.setSubject(assunto);
            if (StringUtils.hasText(corpoTexto)) {
                mensagem.setContent(alternativa(corpoTexto, corpoHtml));
            } else {
                helper.setText(corpoHtml, true);
            }

            mailSender.send(mensagem);
            log.info("E-mail {} aceito pelo servidor SMTP para {} (Message-ID {})",
                    idEnvio, destinoMascarado, idDaMensagem(mensagem));
            return CompletableFuture.completedFuture(null);
        } catch (MessagingException ex) {
            return falhar(idEnvio, destinoMascarado, new MailPreparationException(ex));
        } catch (RuntimeException ex) {
            return falhar(idEnvio, destinoMascarado, ex);
        }
    }

    private static CompletableFuture<Void> falhar(String idEnvio, String destinoMascarado, Exception ex) {
        log.warn("Falha no envio do e-mail {} para {}: {} (detalhes em DEBUG)",
                idEnvio, destinoMascarado, classesDaFalha(ex));
        log.debug("Detalhes da falha no envio do e-mail {}", idEnvio, ex);
        return CompletableFuture.failedFuture(ex);
    }

    private static MimeMultipart alternativa(String corpoTexto, String corpoHtml) throws MessagingException {
        MimeBodyPart texto = new MimeBodyPart();
        texto.setText(corpoTexto, CHARSET);
        MimeBodyPart html = new MimeBodyPart();
        html.setText(corpoHtml, CHARSET, "html");
        MimeMultipart alternativa = new MimeMultipart("alternative");
        alternativa.addBodyPart(texto);
        alternativa.addBodyPart(html);
        return alternativa;
    }

    private static String idDaMensagem(MimeMessage mensagem) {
        try {
            return mensagem.getMessageID();
        } catch (MessagingException ex) {
            return null;
        }
    }

    private static void exigirTexto(String valor, String campo) {
        if (!StringUtils.hasText(valor)) {
            throw new IllegalArgumentException(campo + " em branco");
        }
    }

    static String classesDaFalha(Throwable ex) {
        List<String> classes = new ArrayList<>();
        Set<Throwable> vistas = Collections.newSetFromMap(new IdentityHashMap<>());
        juntarClasses(ex, classes, vistas);
        return String.join(" <- ", classes);
    }

    private static void juntarClasses(Throwable ex, List<String> classes, Set<Throwable> vistas) {
        for (Throwable atual = ex; atual != null && vistas.add(atual); atual = atual.getCause()) {
            classes.add(atual.getClass().getSimpleName());
            if (atual instanceof MailSendException envio) {
                for (Exception porMensagem : envio.getMessageExceptions()) {
                    juntarClasses(porMensagem, classes, vistas);
                }
            }
        }
    }

    public static String mascarar(String email) {
        if (!StringUtils.hasText(email)) {
            return "(vazio)";
        }
        String endereco = email.trim();
        int arroba = endereco.lastIndexOf('@');
        if (arroba <= 0 || arroba == endereco.length() - 1) {
            return "***";
        }
        String local = endereco.substring(0, arroba);
        String dominio = endereco.substring(arroba + 1);
        return (local.length() == 1 ? "*" : local.charAt(0) + "***") + "@" + dominio;
    }
}
