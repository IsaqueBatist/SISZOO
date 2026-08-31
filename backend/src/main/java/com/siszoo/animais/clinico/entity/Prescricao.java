package com.siszoo.animais.clinico.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import com.siszoo.animais.entity.Animal;
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

// Registro clinico imutavel (CLAUDE.md), inclusive para transicoes de
// status (ATIVA->CONCLUIDA/SUSPENSA/CANCELADA): tambem viram uma nova linha
// com `retifica`, nunca um UPDATE na linha anterior. Ver Vacinacao.
@Entity
@Table(name = "prescricao")
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Prescricao {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @EqualsAndHashCode.Include
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "animal_id", nullable = false)
    private Animal animal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "prescrito_por_id")
    private Usuario prescritoPor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medicamento_id", nullable = false)
    private Medicamento medicamento;

    @Column(name = "data_inicio", nullable = false)
    private LocalDate dataInicio;

    @Column(name = "data_fim_prevista")
    private LocalDate dataFimPrevista;

    @Column(name = "data_fim_real")
    private LocalDate dataFimReal;

    @Column(name = "frequencia_aplicada", nullable = false)
    private Integer frequenciaAplicada;

    @Enumerated(EnumType.STRING)
    @Column(name = "unidade_frequencia", nullable = false, length = 10)
    private UnidadeFrequencia unidadeFrequencia;

    @Column(name = "dose_quantidade", nullable = false, precision = 8, scale = 3)
    private BigDecimal doseQuantidade;

    @Enumerated(EnumType.STRING)
    @Column(name = "dose_unidade", nullable = false, length = 30)
    private UnidadeDose doseUnidade;

    @Enumerated(EnumType.STRING)
    @Column(name = "via_administracao", nullable = false, length = 20)
    private ViaAdministracao viaAdministracao;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusPrescricao status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "retifica_id")
    private Prescricao retifica;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;
}
