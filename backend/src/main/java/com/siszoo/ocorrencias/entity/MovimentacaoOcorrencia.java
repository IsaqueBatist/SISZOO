package com.siszoo.ocorrencias.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import com.siszoo.usuarios.entity.Usuario;

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

// Historico da ocorrencia: so INSERT, nunca UPDATE/DELETE (o repositorio nao
// expoe outra escrita). `data` e data de negocio, gravada pelo service com o
// Clock do projeto (D39); `criadoEm` e o carimbo tecnico.
@Entity
@Table(name = "movimentacao_ocorrencia")
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class MovimentacaoOcorrencia {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @EqualsAndHashCode.Include
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ocorrencia_id", nullable = false)
    private Ocorrencia ocorrencia;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_movimentacao", nullable = false, length = 30)
    private TipoMovimentacaoOcorrencia tipoMovimentacao;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_anterior", length = 20)
    private StatusOcorrencia statusAnterior;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_novo", length = 20)
    private StatusOcorrencia statusNovo;

    @Column(nullable = false)
    private LocalDateTime data;

    @Column(columnDefinition = "text")
    private String descricao;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;
}
