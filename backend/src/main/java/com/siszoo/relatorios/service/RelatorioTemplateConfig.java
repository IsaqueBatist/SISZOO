package com.siszoo.relatorios.service;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templatemode.TemplateMode;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

// TemplateEngine dedicado aos relatorios (T41), separado do bean "templateEngine"
// que o autoconfig do Spring Boot registra para a stack web MVC (so existe no
// classpath por causa do starter) — este projeto e uma API REST pura, sem
// nenhuma view Thymeleaf; o uso aqui e so programatico (processar um template
// em String para o Flying Saucer renderizar). Thymeleaf 3.x nao tem mais um
// TemplateMode.XHTML separado (foi unificado em HTML, com parser tolerante a
// HTML5) — o XHTML bem formado que o Flying Saucer exige fica a cargo de como
// os templates em si sao escritos (tags void autofechadas, namespace xmlns),
// nao de uma configuracao do engine.
//
// SpringTemplateEngine (nao TemplateEngine puro): o dialeto padrao do
// Thymeleaf puro usa OGNL para `${...}`, e `ognl:ognl` nao e trazido
// transitivamente por spring-boot-starter-thymeleaf nesta versao (Spring Boot
// 4.1 so usa SpringTemplateEngine internamente, que troca OGNL por SpringEL —
// ja disponivel via spring-context, sem dependencia nova).
@Configuration
public class RelatorioTemplateConfig {

    @Bean("templateEngineRelatorios")
    public TemplateEngine templateEngineRelatorios() {
        ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix("templates/relatorios/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode(TemplateMode.HTML);
        resolver.setCharacterEncoding("UTF-8");
        resolver.setCacheable(true);

        SpringTemplateEngine engine = new SpringTemplateEngine();
        engine.setTemplateResolver(resolver);
        return engine;
    }
}
