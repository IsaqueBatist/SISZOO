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

// Registro clinico imutavel (CLAUDE.md): sem setters de negocio chamados apos
// o insert original. Correcao = nova linha com `retifica` apontando para esta.
@Entity
@Table(name = "vacinacao")
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Vacinacao {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @EqualsAndHashCode.Include
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "animal_id", nullable = false)
    private Animal animal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vacina_id", nullable = false)
    private Vacina vacina;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "aplicado_por_id")
    private Usuario aplicadoPor;

    @Column(name = "data_aplicacao", nullable = false)
    private LocalDate dataAplicacao;

    @Column(name = "numero_dose")
    private Integer numeroDose;

    @Column(name = "dose_quantidade", nullable = false, precision = 8, scale = 3)
    private BigDecimal doseQuantidade;

    @Enumerated(EnumType.STRING)
    @Column(name = "dose_unidade", length = 30)
    private UnidadeDose doseUnidade;

    @Column(length = 100)
    private String lote;

    @Column(columnDefinition = "text")
    private String observacoes;

    // Auto-referencia: preenchida so no INSERT da linha que corrige esta.
    // Nunca atualizada depois de gravada (ver com.siszoo.animais.clinico.service.VacinacaoService).
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "retifica_id")
    private Vacinacao retifica;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;
}
