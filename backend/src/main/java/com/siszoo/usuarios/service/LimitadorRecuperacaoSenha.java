package com.siszoo.usuarios.service;

import java.time.Duration;
import java.util.Locale;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.siszoo.usuarios.exception.LimiteTentativasException;

// Limite de tentativas da recuperacao de senha, em memoria e por instancia
// (o CCZ roda uma so), sobre JanelaDeTentativas.
//
// Tres contadores independentes:
// - solicitacoes por e-mail: freia o envio repetido para uma mesma caixa;
// - solicitacoes por IP: freia a varredura de e-mails a partir de um ponto;
// - consumo (validar/redefinir) por IP: freia a adivinhacao de tokens, que ja
//   e inviavel pelos 256 bits de entropia.
// O IP e o do socket (getRemoteAddr), como na auditoria; atras de um
// proxy todos os clientes compartilham o mesmo limite.
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

    // Conta a solicitacao antes de qualquer consulta ao banco: um e-mail
    // inexistente gasta a cota do mesmo jeito que um cadastrado.
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
