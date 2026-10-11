package com.siszoo.processos.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.siszoo.ocorrencias.entity.Ocorrencia;
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
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// Versao minima (T25, D2/D18): so o necessario para o vinculo opcional com a
// ocorrencia. Doenca, laboratorio, resultado, amostras e documentos ficam para
// a task de processos. O vinculo mora so aqui (ocorrencia_id UNIQUE NULL).
@Entity
@Table(name = "processo_sanitario")
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class ProcessoSanitario {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @EqualsAndHashCode.Include
    private UUID id;

    @Column(nullable = false, unique = true, length = 20)
    private String protocolo;

    @Column(name = "data_abertura", nullable = false)
    private LocalDate dataAbertura;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ocorrencia_id", unique = true)
    private Ocorrencia ocorrencia;

    @Column(nullable = false)
    private boolean urgente;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_processo", nullable = false, length = 30)
    private StatusProcesso statusProcesso = StatusProcesso.ABERTO;

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
