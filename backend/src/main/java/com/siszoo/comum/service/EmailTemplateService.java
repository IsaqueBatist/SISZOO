package com.siszoo.comum.service;

import java.util.Locale;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.thymeleaf.ITemplateEngine;
import org.thymeleaf.context.Context;

@Service
public class EmailTemplateService {

    private static final Locale PT_BR = Locale.of("pt", "BR");

    private final ITemplateEngine templateEngine;

    public EmailTemplateService(ITemplateEngine templateEngine) {
        this.templateEngine = templateEngine;
    }

    public String renderizarHtml(String template, Map<String, Object> variaveis) {
        return templateEngine.process(template, new Context(PT_BR, variaveis));
    }

    public String renderizarTexto(String template, Map<String, Object> variaveis) {
        return templateEngine.process(template + ".txt", new Context(PT_BR, variaveis));
    }
}
