package com.siszoo.processos.entity;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// Municipe responsavel pelo animal investigado (DER §3.5), 1:1 com o processo.
// Dados pessoais: nao entram nos snapshots de auditoria (como a D23).
@Entity
@Table(name = "responsavel_processo")
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class ResponsavelProcesso {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @EqualsAndHashCode.Include
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "processo_id", nullable = false, unique = true, updatable = false)
    private ProcessoSanitario processo;

    @Column(nullable = false, length = 150)
    private String nome;

    @Column(length = 14)
    private String cpf;

    @Column(length = 20)
    private String telefone;

    @Column(length = 150)
    private String email;

    @Column(length = 10)
    private String cep;

    @Column(length = 255)
    private String endereco;

    @Column(name = "bairro_residencial", length = 80)
    private String bairroResidencial;

    @Column(name = "bairro_ocorrencia", length = 80)
    private String bairroOcorrencia;
}
