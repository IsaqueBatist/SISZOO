package com.siszoo.ocorrencias.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

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

// So metadados. O conteudo (bytea) fica em AnexoOcorrenciaConteudo, que aponta
// para ca; nao ha associacao no sentido inverso, entao nenhuma consulta de
// anexo chega ao conteudo sem passar pelo repositorio dele (D9).
@Entity
@Table(name = "anexo_ocorrencia")
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class AnexoOcorrencia {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @EqualsAndHashCode.Include
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ocorrencia_id", nullable = false)
    private Ocorrencia ocorrencia;

    @Column(nullable = false, length = 255)
    private String nome;

    @Column(name = "mime_type", nullable = false, length = 50)
    private String mimeType;

    @Column(nullable = false)
    private int tamanho;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "criado_por_id", nullable = false)
    private Usuario criadoPor;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;
}
