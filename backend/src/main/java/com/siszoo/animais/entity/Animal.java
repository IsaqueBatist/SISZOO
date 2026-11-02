package com.siszoo.animais.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

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
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
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

    @Column(unique = true, nullable = true, length = 30)
    private String microchip;

    @Column(name = "numero_medalha", length = 30)
    private String numeroMedalha;

    @Column(name = "data_implantacao_chip")
    private LocalDate dataImplantacaoChip;

    @Column(length = 200)
    private String procedencia;

    @Column(name = "laudo_eutanasia", columnDefinition = "text")
    private String laudoEutanasia;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "laudo_eutanasia_responsavel_id")
    private Usuario laudoEutanasiaResponsavel;

    @Column(name = "laudo_eutanasia_crmv", length = 20)
    private String laudoEutanasiaCrmv;

    @Column(name = "laudo_eutanasia_metodo", length = 120)
    private String laudoEutanasiaMetodo;

    @Column(name = "laudo_eutanasia_insensibilizacao_previa")
    private Boolean laudoEutanasiaInsensibilizacaoPrevia;

    @Column(name = "laudo_eutanasia_registrado_em")
    private LocalDateTime laudoEutanasiaRegistradoEm;

    @Column(name = "destino_transferencia", length = 200)
    private String destinoTransferencia;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_destino_transferencia", length = 40)
    private TipoDestinoTransferencia tipoDestinoTransferencia;

    @Column(name = "data_saida")
    private LocalDateTime dataSaida;

    @Column(name = "documento_transferencia", length = 120)
    private String documentoTransferencia;

    @Column
    private Boolean esterilizado;

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

    @Column(name = "foto_miniatura", columnDefinition = "text")
    private String fotoMiniatura;

    @Column(columnDefinition = "text")
    private String observacoes;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "animal_condicao_saude",
            joinColumns = @JoinColumn(name = "animal_id"),
            inverseJoinColumns = @JoinColumn(name = "condicao_saude_id"))
    private Set<CondicaoSaude> condicoes = new HashSet<>();

    @Column(name = "condicoes_outras", length = 500)
    private String condicoesOutras;

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
