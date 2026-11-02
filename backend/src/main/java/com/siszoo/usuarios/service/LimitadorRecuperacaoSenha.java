package com.siszoo.usuarios.service;

import java.time.Duration;
import java.util.Locale;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.siszoo.usuarios.exception.LimiteTentativasException;

@Component
public class LimitadorRecuperacaoSenha {

    private final int solicitacoesPorEmail;
    private final int solicitacoesPorIp;
    private final int consumosPorIp;
    private final JanelaDeTentativas solicitacoesEmail;
    private final JanelaDeTentativas solicitacoesIp;
    private final JanelaDeTentativas consumosIp;

    public LimitadorRecuperacaoSenha(
            @Value("${siszoo.recuperacao-senha.limite.solicitacoes-por-email}") int solicitacoesPorEmail,
            @Value("${siszoo.recuperacao-senha.limite.solicitacoes-por-ip}") int solicitacoesPorIp,
            @Value("${siszoo.recuperacao-senha.limite.janela-solicitacoes-minutos}") long janelaSolicitacoesMinutos,
            @Value("${siszoo.recuperacao-senha.limite.consumos-por-ip}") int consumosPorIp,
            @Value("${siszoo.recuperacao-senha.limite.janela-consumos-minutos}") long janelaConsumosMinutos) {
        this.solicitacoesPorEmail = solicitacoesPorEmail;
        this.solicitacoesPorIp = solicitacoesPorIp;
        this.consumosPorIp = consumosPorIp;
        Duration janelaSolicitacoes = Duration.ofMinutes(janelaSolicitacoesMinutos);
        this.solicitacoesEmail = new JanelaDeTentativas(janelaSolicitacoes);
        this.solicitacoesIp = new JanelaDeTentativas(janelaSolicitacoes);
        this.consumosIp = new JanelaDeTentativas(Duration.ofMinutes(janelaConsumosMinutos));
    }

    public void registrarSolicitacao(String email, String ip) {
        boolean dentroDoLimiteIp = solicitacoesIp.incrementar(chaveIp(ip)) <= solicitacoesPorIp;
        boolean dentroDoLimiteEmail = solicitacoesEmail.incrementar(normalizar(email)) <= solicitacoesPorEmail;
        if (!dentroDoLimiteIp || !dentroDoLimiteEmail) {
            throw new LimiteTentativasException();
        }
    }

    public void registrarConsumo(String ip) {
        if (consumosIp.incrementar(chaveIp(ip)) > consumosPorIp) {
            throw new LimiteTentativasException();
        }
    }

    static String normalizar(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    static String chaveIp(String ip) {
        return ip == null ? "desconhecido" : ip;
    }
}
