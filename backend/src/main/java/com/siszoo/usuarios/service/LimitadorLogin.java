package com.siszoo.usuarios.service;

import java.time.Duration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.siszoo.comum.service.EmailService;
import com.siszoo.usuarios.exception.LimiteTentativasException;

@Component
public class LimitadorLogin {

    private static final Logger log = LoggerFactory.getLogger(LimitadorLogin.class);

    private final int falhasPorEmail;
    private final int falhasPorIp;
    private final JanelaDeTentativas falhasEmail;
    private final JanelaDeTentativas falhasIp;

    public LimitadorLogin(
            @Value("${siszoo.login.limite.falhas-por-email}") int falhasPorEmail,
            @Value("${siszoo.login.limite.falhas-por-ip}") int falhasPorIp,
            @Value("${siszoo.login.limite.janela-minutos}") long janelaMinutos) {
        this.falhasPorEmail = falhasPorEmail;
        this.falhasPorIp = falhasPorIp;
        Duration janela = Duration.ofMinutes(janelaMinutos);
        this.falhasEmail = new JanelaDeTentativas(janela);
        this.falhasIp = new JanelaDeTentativas(janela);
    }

    public void exigirPermitido(String email, String ip) {
        String chaveEmail = LimitadorRecuperacaoSenha.normalizar(email);
        String chaveIp = LimitadorRecuperacaoSenha.chaveIp(ip);
        if (falhasEmail.contagem(chaveEmail) >= falhasPorEmail || falhasIp.contagem(chaveIp) >= falhasPorIp) {
            log.warn("Login recusado por limite de tentativas para {} a partir de {}", EmailService.mascarar(email), chaveIp);
            throw new LimiteTentativasException();
        }
    }

    public void registrarFalha(String email, String ip) {
        falhasEmail.incrementar(LimitadorRecuperacaoSenha.normalizar(email));
        falhasIp.incrementar(LimitadorRecuperacaoSenha.chaveIp(ip));
    }

    public void registrarSucesso(String email) {
        falhasEmail.limpar(LimitadorRecuperacaoSenha.normalizar(email));
    }
}
