package com.siszoo.processos.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.siszoo.ocorrencias.entity.Ocorrencia;
import com.siszoo.ocorrencias.exception.VinculoJaExistenteException;
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
import lombok.AccessLevel;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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

    @Column(nullable = false, unique = true, length = 20, updatable = false)
    private String protocolo;

    @Column(name = "data_abertura", nullable = false)
    private LocalDate dataAbertura;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doenca_id", nullable = false)
    private Doenca doenca;

    @Column(length = 20)
    private String cid;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "laboratorio_id", nullable = false)
    private Laboratorio laboratorio;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ocorrencia_id", unique = true)
    @Setter(AccessLevel.NONE)
    private Ocorrencia ocorrencia;

    @Column(nullable = false)
    private boolean urgente;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_processo", nullable = false, length = 30)
    private StatusProcesso statusProcesso = StatusProcesso.ABERTO;

    @Column(name = "gal_numero", length = 40)
    private String galNumero;

    @Column(name = "sinan_numero", length = 40)
    private String sinanNumero;

    @Column(name = "data_envio_amostras")
    private LocalDateTime dataEnvioAmostras;

    @Column(name = "previsao_retorno")
    private LocalDate previsaoRetorno;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resultado_laboratorial_id")
    @Setter(AccessLevel.NONE)
    private ResultadoLaboratorial resultadoLaboratorial;

    @Column(name = "data_resultado")
    @Setter(AccessLevel.NONE)
    private LocalDate dataResultado;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "desfecho_animal_id")
    private DesfechoAnimal desfechoAnimal;

    @Column(columnDefinition = "text")
    private String observacoes;

    @Column(name = "data_notificacao_municipe")
    @Setter(AccessLevel.NONE)
    private LocalDateTime dataNotificacaoMunicipe;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "criado_por_id", nullable = false)
    private Usuario criadoPor;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;

    public void vincularOcorrencia(Ocorrencia ocorrencia) {
        if (this.ocorrencia != null) {
            throw new VinculoJaExistenteException();
        }
        this.ocorrencia = ocorrencia;
    }

    public void aplicarResultadoVigente(ResultadoProcesso registro) {
        this.resultadoLaboratorial = registro.getResultadoLaboratorial();
        this.dataResultado = registro.getDataResultado();
        this.statusProcesso = StatusProcesso.COM_RESULTADO;
    }

    public boolean registrarNotificacaoMunicipe(LocalDateTime aceitoEm) {
        if (this.dataNotificacaoMunicipe != null) {
            return false;
        }
        this.dataNotificacaoMunicipe = aceitoEm;
        return true;
    }

    public void reiniciarNotificacaoMunicipe() {
        this.dataNotificacaoMunicipe = null;
    }
}
