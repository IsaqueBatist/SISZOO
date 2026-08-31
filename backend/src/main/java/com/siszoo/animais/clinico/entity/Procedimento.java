package com.siszoo.animais.clinico.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import com.siszoo.animais.entity.Animal;
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

// Registro clinico imutavel (CLAUDE.md): ver Vacinacao para o mecanismo de
// retificacao (nova linha + `retifica`, nunca UPDATE na linha original).
@Entity
@Table(name = "procedimento")
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Procedimento {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @EqualsAndHashCode.Include
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "animal_id", nullable = false)
    private Animal animal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tipo_procedimento_id", nullable = false)
    private TipoProcedimento tipoProcedimento;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "executado_por_id")
    private Usuario executadoPor;

    @Column(nullable = false)
    private LocalDate data;

    @Column(columnDefinition = "text")
    private String descricao;

    @Column(columnDefinition = "text")
    private String resultado;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "retifica_id")
    private Procedimento retifica;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;
}
