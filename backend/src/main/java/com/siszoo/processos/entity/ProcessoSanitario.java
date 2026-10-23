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

// Modelo-alvo do DER §3.5 (T29, V13). Responsavel e amostras ficam fora da
// entidade (sem colecao nem cascade), gravados pelo service na mesma transacao,
// como denunciante e anexos na ocorrencia. O resultado vigente e sua data vem
// do registro de resultado (T34, historico em ResultadoProcesso); desfecho,
// GAL/SINAN e datas de envio sao preenchidos por tasks seguintes.
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

    // Snapshot de doenca.cid na criacao: preserva o CID da epoca.
    @Column(length = 20)
    private String cid;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "laboratorio_id", nullable = false)
    private Laboratorio laboratorio;

    // Vinculo definido uma unica vez (DER regra 15): so por vincularOcorrencia,
    // sem setter. O banco recusa troca ou remocao (trigger da V13).
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ocorrencia_id", unique = true)
    @Setter(AccessLevel.NONE)
    private Ocorrencia ocorrencia;

    // Derivado das amostras (DER regra 18): contato humano em qualquer uma.
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

    // Resultado vigente (T34): copia do ultimo registro nao retificado de
    // resultado_processo, gravada so por aplicarResultadoVigente.
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

    // T35/#37 (V21): quando o SMTP aceitou o e-mail de resultado positivo ao
    // municipe. Gravada uma vez so, por registrarNotificacaoMunicipe.
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

    // O service valida a transicao antes (StatusProcesso, T34): o primeiro
    // resultado leva AGUARDANDO_RESULTADO a COM_RESULTADO; a correcao so
    // acontece em COM_RESULTADO e mantem o status.
    public void aplicarResultadoVigente(ResultadoProcesso registro) {
        this.resultadoLaboratorial = registro.getResultadoLaboratorial();
        this.dataResultado = registro.getDataResultado();
        this.statusProcesso = StatusProcesso.COM_RESULTADO;
    }

    // Idempotente dentro de um mesmo lancamento: a primeira data aceita fica
    // (o envio de um lancamento nao se repete). Devolve se gravou.
    public boolean registrarNotificacaoMunicipe(LocalDateTime aceitoEm) {
        if (this.dataNotificacaoMunicipe != null) {
            return false;
        }
        this.dataNotificacaoMunicipe = aceitoEm;
        return true;
    }

    // RN10 (F2-014): um novo lancamento notificavel (ex.: inconclusivo corrigido
    // para positivo) e uma nova notificacao — a data do envio anterior deixa de
    // valer ate o SMTP aceitar o novo e-mail.
    public void reiniciarNotificacaoMunicipe() {
        this.dataNotificacaoMunicipe = null;
    }
}
