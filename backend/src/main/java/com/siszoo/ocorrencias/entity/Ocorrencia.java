package com.siszoo.ocorrencias.entity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.siszoo.ocorrencias.exception.TransicaoStatusInvalidaException;
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
import lombok.AccessLevel;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// O status e os campos de encerramento nao tem setter publico: so mudam por
// iniciarAtendimento()/encerrar(), que aplicam a matriz D5. Quem chama
// (OcorrenciaService) grava a movimentacao correspondente na mesma transacao.
// Denunciante, denunciado, anexos e processo vinculado ficam fora da entidade
// (relacoes do lado filho), para a listagem nao carregar nada disso por linha.
@Entity
@Table(name = "ocorrencia")
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Ocorrencia {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @EqualsAndHashCode.Include
    private UUID id;

    @Column(nullable = false, unique = true, length = 20)
    private String protocolo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tipo_ocorrencia_id", nullable = false)
    private TipoOcorrencia tipoOcorrencia;

    @Setter(AccessLevel.NONE)
    @Enumerated(EnumType.STRING)
    @Column(name = "status_ocorrencia", nullable = false, length = 20)
    private StatusOcorrencia statusOcorrencia = StatusOcorrencia.ABERTA;

    @Column(name = "data_abertura", nullable = false)
    private LocalDate dataAbertura;

    @Column(name = "hora_abertura")
    private LocalTime horaAbertura;

    @Column(nullable = false, length = 255)
    private String endereco;

    @Column(nullable = false, length = 80)
    private String bairro;

    @Column(name = "ponto_referencia", length = 255)
    private String pontoReferencia;

    @Column(nullable = false, columnDefinition = "text")
    private String descricao;

    @Column(nullable = false)
    private boolean urgente;

    @Column(nullable = false)
    private boolean sigilosa;

    @Column(nullable = false)
    private boolean anonima;

    @Column(precision = 9, scale = 6)
    private BigDecimal latitude;

    @Column(precision = 9, scale = 6)
    private BigDecimal longitude;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registrado_por_id", nullable = false)
    private Usuario registradoPor;

    @Setter(AccessLevel.NONE)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "providencia_tomada_id")
    private ProvidenciaTomada providenciaTomada;

    @Setter(AccessLevel.NONE)
    @Column(name = "descricao_encerramento", columnDefinition = "text")
    private String descricaoEncerramento;

    @Setter(AccessLevel.NONE)
    @Column(name = "encerrada_em")
    private LocalDateTime encerradaEm;

    @Setter(AccessLevel.NONE)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "encerrada_por_id")
    private Usuario encerradaPor;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;

    public boolean isEncerrada() {
        return statusOcorrencia == StatusOcorrencia.ENCERRADA;
    }

    // D5: ABERTA -> EM_ATENDIMENTO e a unica transicao fora do encerramento.
    public StatusOcorrencia iniciarAtendimento() {
        if (statusOcorrencia != StatusOcorrencia.ABERTA) {
            throw new TransicaoStatusInvalidaException();
        }
        StatusOcorrencia anterior = statusOcorrencia;
        statusOcorrencia = StatusOcorrencia.EM_ATENDIMENTO;
        return anterior;
    }

    // D5: encerra a partir de EM_ATENDIMENTO, ou direto de ABERTA so com as
    // providencias de ProvidenciaTomada.CODIGOS_ENCERRAMENTO_DIRETO.
    public StatusOcorrencia encerrar(ProvidenciaTomada providencia, String descricao, LocalDateTime em, Usuario por) {
        boolean deEmAtendimento = statusOcorrencia == StatusOcorrencia.EM_ATENDIMENTO;
        boolean diretoDeAberta = statusOcorrencia == StatusOcorrencia.ABERTA
                && ProvidenciaTomada.CODIGOS_ENCERRAMENTO_DIRETO.contains(providencia.getCodigo());
        if (!deEmAtendimento && !diretoDeAberta) {
            throw new TransicaoStatusInvalidaException();
        }
        StatusOcorrencia anterior = statusOcorrencia;
        statusOcorrencia = StatusOcorrencia.ENCERRADA;
        providenciaTomada = providencia;
        descricaoEncerramento = descricao;
        encerradaEm = em;
        encerradaPor = por;
        return anterior;
    }
}
