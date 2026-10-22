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

/**
 * Envio de e-mail do sistema (T35): ponto unico que fala com o SMTP
 * configurado em {@code spring.mail.*} (docs/email.md). O corpo vem pronto
 * de quem chama, normalmente de {@link EmailTemplateService}.
 *
 * <p>Os dois {@code enviar} sao {@link Async}: rodam no executor do
 * {@code @EnableAsync} e devolvem na hora um future. A validacao dos
 * argumentos e o envio acontecem na thread assincrona: argumento invalido ou
 * falha de SMTP aparecem so como future completado com erro, ja logado aqui.
 * Quem nao precisa do resultado pode ignorar o future. <b>Excecao:</b> se o
 * executor recusar a tarefa (ex.: aplicacao encerrando), a
 * {@link org.springframework.core.task.TaskRejectedException} sobe na propria
 * chamada — o proxy submete na thread de quem chama (Spring 7,
 * {@code submitCompletable}; docs/decisoes/T35.md T35-17).
 *
 * <p>Sucesso significa que o servidor SMTP aceitou a mensagem, nao que ela
 * foi entregue ou lida. Nao ha fila nem retentativa.
 *
 * <p>Log (LGPD): destinatario sempre mascarado; nunca assunto, corpo ou
 * credenciais. Na falha, o WARN leva so as classes da excecao — mensagens de
 * erro do SMTP podem repetir o endereco — e o throwable completo vai para o
 * DEBUG, com o mesmo id de envio para correlacionar.
 */
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

    /** Envia so HTML (assinatura da issue #36). Ver {@link #enviar(String, String, String, String)}. */
    @Async
    public CompletableFuture<Void> enviar(String destinatario, String assunto, String corpoHtml) {
        return enviar(destinatario, assunto, corpoHtml, null);
    }

    /**
     * Com {@code corpoTexto}, a mensagem vai como {@code multipart/alternative}
     * (texto puro e HTML), melhor para filtros de spam e leitores de texto;
     * sem ele, como um unico {@code text/html}.
     */
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

    // Texto puro primeiro: a ultima parte e a preferida (RFC 2046, 5.1.4).
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

    // Depois do send: uma falha aqui nao pode virar "falha de envio".
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

    /**
     * Cadeia de classes da excecao, sem mensagens (podem trazer o endereco).
     * Inclui as excecoes por mensagem de um {@link MailSendException}, onde o
     * Spring guarda a causa das falhas depois de conectar.
     */
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

    /**
     * {@code maria@x.test} vira {@code m***@x.test}; parte local de um
     * caractere, {@code *@x.test}; sem {@code @}, sem parte local ou sem
     * dominio, {@code ***}; nulo ou em branco, {@code (vazio)}.
     */
    static String mascarar(String email) {
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
