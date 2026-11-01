package com.siszoo.usuarios.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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

// Sessao de login (V29, docs/decisoes/sessao.md). Os hashes sao SHA-256 do
// token de renovacao: o token em si so existe no cookie httpOnly do navegador.
@Entity
@Table(name = "sessao_usuario")
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class SessaoUsuario {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @EqualsAndHashCode.Include
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false, updatable = false)
    private Usuario usuario;

    @Column(name = "token_hash", nullable = false, length = 64)
    private String tokenHash;

    @Column(name = "token_anterior_hash", length = 64)
    private String tokenAnteriorHash;

    @Column(name = "rotacionado_em", nullable = false)
    private LocalDateTime rotacionadoEm;

    @Column(name = "criada_em", nullable = false, updatable = false)
    private LocalDateTime criadaEm;

    @Column(name = "ultima_atividade_em", nullable = false)
    private LocalDateTime ultimaAtividadeEm;

    @Column(name = "encerrada_em")
    private LocalDateTime encerradaEm;

    @Enumerated(EnumType.STRING)
    @Column(name = "motivo_encerramento", length = 30)
    private MotivoEncerramentoSessao motivoEncerramento;

    @Column(length = 45)
    private String ip;

    @Column(name = "user_agent", length = 255)
    private String userAgent;

    public void encerrar(LocalDateTime agora, MotivoEncerramentoSessao motivo) {
        if (encerradaEm == null) {
            encerradaEm = agora;
            motivoEncerramento = motivo;
        }
    }
}
