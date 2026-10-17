package com.siszoo.processos.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import com.siszoo.animais.entity.Animal;
import com.siszoo.animais.entity.Especie;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// Animal amostrado (DER §3.5). animal nulo = animal de campo, com dados
// proprios; preenchido = animal do canil, com a identificacao copiada da ficha
// na criacao (snapshot, DH-5). Os campos clinicos sao sempre da amostra: nada
// aqui e relido de Animal, que so e referenciado.
@Entity
@Table(name = "animal_amostrado")
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class AnimalAmostrado {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @EqualsAndHashCode.Include
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "processo_id", nullable = false, updatable = false)
    private ProcessoSanitario processo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "animal_id", updatable = false)
    private Animal animal;

    // ── Identificacao (snapshot no modo canil) ──

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "especie_id", nullable = false)
    private Especie especie;

    // Mesmo dominio de animal.sexo/pelagem (V4, minusculas, DH-9).
    @Column(nullable = false, length = 20)
    private String sexo;

    @Column(length = 80)
    private String raca;

    @Column(length = 80)
    private String coloracao;

    @Column(length = 10)
    private String pelagem;

    @Column(name = "idade_aprox", length = 30)
    private String idadeAprox;

    @Column(name = "peso_kg", precision = 5, scale = 2)
    private BigDecimal pesoKg;

    // ── Campos clinicos da amostragem ──

    @Enumerated(EnumType.STRING)
    @Column(name = "status_clinico", nullable = false, length = 20)
    private StatusClinicoAmostra statusClinico;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_abrigo", nullable = false, length = 20)
    private TipoAbrigo tipoAbrigo;

    @Column(name = "alteracao_comportamental", columnDefinition = "text")
    private String alteracaoComportamental;

    @Column(name = "data_coleta", nullable = false)
    private LocalDate dataColeta;

    @Enumerated(EnumType.STRING)
    @Column(name = "material_biologico", nullable = false, length = 20)
    private MaterialBiologico materialBiologico;

    @Column(name = "contato_humano", nullable = false)
    private boolean contatoHumano;

    @Enumerated(EnumType.STRING)
    @Column(name = "nivel_contato", length = 10)
    private NivelContato nivelContato;

    @Column(name = "agrediu_humano")
    private Boolean agrediuHumano;

    @Column(columnDefinition = "text")
    private String observacoes;

    // Sem cascade: sintoma e catalogo; so a linha de amostra_sintoma e gravada.
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "amostra_sintoma",
            joinColumns = @JoinColumn(name = "animal_amostrado_id"),
            inverseJoinColumns = @JoinColumn(name = "sintoma_id"))
    private Set<Sintoma> sintomas = new HashSet<>();

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;
}
