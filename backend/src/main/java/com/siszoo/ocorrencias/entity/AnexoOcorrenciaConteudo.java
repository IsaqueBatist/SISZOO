package com.siszoo.ocorrencias.entity;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// Conteudo do anexo em tabela propria (D9): so e lido no download.
@Entity
@Table(name = "anexo_ocorrencia_conteudo")
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class AnexoOcorrenciaConteudo {

    @Id
    @Column(name = "anexo_id")
    @EqualsAndHashCode.Include
    private UUID anexoId;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "anexo_id")
    private AnexoOcorrencia anexo;

    @Column(nullable = false)
    private byte[] conteudo;
}
