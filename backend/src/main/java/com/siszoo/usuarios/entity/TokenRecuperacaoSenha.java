package com.siszoo.usuarios.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// Token de recuperacao de senha (V34, docs/decisoes/recuperacao-senha.md). Como
// na SessaoUsuario, so o hash SHA-256 fica no banco: o token em si vai no link
// do e-mail e nunca e gravado nem logado.
@Entity
@Table(name = "token_recuperacao_senha")
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class TokenRecuperacaoSenha {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @EqualsAndHashCode.Include
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false, updatable = false)
    private Usuario usuario;

    @Column(name = "token_hash", nullable = false, length = 64, updatable = false)
    private String tokenHash;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @Column(name = "expira_em", nullable = false, updatable = false)
    private LocalDateTime expiraEm;

    @Column(name = "usado_em")
    private LocalDateTime usadoEm;

    @Column(name = "invalidado_em")
    private LocalDateTime invalidadoEm;

    @Column(name = "ip_solicitacao", length = 45, updatable = false)
    private String ipSolicitacao;

    // Pendente = ainda pode ser consumido: nunca usado, nunca invalidado e
    // dentro do prazo.
    public boolean pendenteEm(LocalDateTime agora) {
        return usadoEm == null && invalidadoEm == null && !expiraEm.isBefore(agora);
    }
}
