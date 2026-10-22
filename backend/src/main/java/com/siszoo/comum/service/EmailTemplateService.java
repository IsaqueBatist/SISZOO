package com.siszoo.comum.service;

import java.util.Locale;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.thymeleaf.ITemplateEngine;
import org.thymeleaf.context.Context;

/**
 * Renderiza os templates de e-mail (T35) de {@code src/main/resources/templates/}.
 * O HTML usa o resolver do Boot ({@code <nome>.html}, modo HTML: {@code th:text}
 * escapa o conteudo); o texto puro, o resolver de {@code EmailTemplateConfig}
 * ({@code <nome>.txt}, modo TEXT). Separado do {@link EmailService} de
 * proposito: renderiza na thread de quem chama, e o envio e que vai para o
 * proxy {@code @Async}. Como adicionar um template: docs/email.md.
 */
@Service
public class EmailTemplateService {

    private static final Locale PT_BR = Locale.of("pt", "BR");

    private final ITemplateEngine templateEngine;

    public EmailTemplateService(ITemplateEngine templateEngine) {
        this.templateEngine = templateEngine;
    }

    /** {@code template} sem extensao, ex.: {@code email/resultado-processo}. */
    public String renderizarHtml(String template, Map<String, Object> variaveis) {
        return templateEngine.process(template, new Context(PT_BR, variaveis));
    }

    /** Mesmo nome do HTML; le {@code <template>.txt}. */
    public String renderizarTexto(String template, Map<String, Object> variaveis) {
        return templateEngine.process(template + ".txt", new Context(PT_BR, variaveis));
    }
}
