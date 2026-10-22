package com.siszoo.comum.config;

import java.util.Set;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.thymeleaf.spring6.templateresolver.SpringResourceTemplateResolver;
import org.thymeleaf.templatemode.TemplateMode;

// T35: versao em texto puro dos e-mails (EmailTemplateService.renderizarTexto).
// O resolver do Boot (defaultTemplateResolver, so modo HTML e sufixo .html)
// continua ativo — ele so sai com outro bean de mesmo nome — e o
// TemplateEngine usa os dois. Este responde so a email/*.txt e, se o arquivo
// nao existir, passa adiante.
@Configuration
public class EmailTemplateConfig {

    @Bean
    SpringResourceTemplateResolver emailTextoTemplateResolver() {
        SpringResourceTemplateResolver resolver = new SpringResourceTemplateResolver();
        resolver.setPrefix("classpath:/templates/");
        resolver.setSuffix("");
        resolver.setTemplateMode(TemplateMode.TEXT);
        resolver.setCharacterEncoding("UTF-8");
        resolver.setResolvablePatterns(Set.of("email/*.txt"));
        resolver.setCheckExistence(true);
        resolver.setOrder(1);
        return resolver;
    }
}
