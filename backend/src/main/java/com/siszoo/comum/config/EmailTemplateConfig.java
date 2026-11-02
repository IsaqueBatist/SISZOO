package com.siszoo.comum.config;

import java.util.Set;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.thymeleaf.spring6.templateresolver.SpringResourceTemplateResolver;
import org.thymeleaf.templatemode.TemplateMode;

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
