package com.siszoo.ocorrencias.entity;

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

// Dados pessoais (LGPD): em ocorrencia sigilosa so saem da API para quem tem
// OCORRENCIAS_DENUNCIAS:denunciante_sigiloso:leitura (D14), e nunca entram no
// snapshot de auditoria (D23).
@Entity
@Table(name = "denunciante")
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Denunciante {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @EqualsAndHashCode.Include
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ocorrencia_id", nullable = false, unique = true)
    private Ocorrencia ocorrencia;

    @Column(length = 150)
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
}
