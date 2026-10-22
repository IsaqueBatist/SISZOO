package com.siszoo.comum.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.siszoo.comum.security.PreAutorizacaoInterceptor;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final PreAutorizacaoInterceptor preAutorizacaoInterceptor;

    public WebMvcConfig(PreAutorizacaoInterceptor preAutorizacaoInterceptor) {
        this.preAutorizacaoInterceptor = preAutorizacaoInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(preAutorizacaoInterceptor);
    }
}
