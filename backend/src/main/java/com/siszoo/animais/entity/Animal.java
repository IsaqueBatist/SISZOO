package com.siszoo.animais.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.siszoo.usuarios.entity.Usuario;

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

@Entity
@Table(name = "animal")
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Animal {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @EqualsAndHashCode.Include
    private UUID id;

    @Column(nullable = false, length = 80)
    private String nome;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "especie_id", nullable = false)
    private Especie especie;

    @Column(nullable = false, length = 20)
    private String sexo;

    @Column(length = 80)
    private String raca;

    @Column(length = 80)
    private String coloracao;

    @Column(length = 10)
    private String pelagem;

    @Column(length = 10)
    private String porte;

    @Column(name = "peso_kg", precision = 5, scale = 2)
    private BigDecimal pesoKg;

    @Column(name = "idade_aprox", length = 30)
    private String idadeAprox;

    @Column(name = "data_nascimento_aprox")
    private LocalDate dataNascimentoAprox;

    // PostgreSQL 16 (Constraints/Indexes): UNIQUE sobre coluna nullable trata
    // múltiplos NULL como distintos, satisfazendo "único quando informado"
    // (DER §3.2) sem exigir índice parcial.
    @Column(unique = true, nullable = true, length = 30)
    private String microchip;

    @Column(nullable = false)
    private boolean esterilizado = false;

    @Column(name = "data_esterilizacao")
    private LocalDate dataEsterilizacao;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "status_id", nullable = false)
    private StatusAnimal status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "motivo_entrada_id", nullable = false)
    private MotivoEntrada motivoEntrada;

    @Column(name = "data_entrada", nullable = false)
    private LocalDateTime dataEntrada;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "baia_id", nullable = true)
    private Baia baia;

    @Column(name = "ficha_completa", nullable = false)
    private boolean fichaCompleta = false;

    @Column(name = "foto_url", columnDefinition = "text")
    private String fotoUrl;

    @Column(columnDefinition = "text")
    private String observacoes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "criado_por_id", nullable = false)
    private Usuario criadoPor;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;
}
