package com.siszoo.processos.entity;

import java.time.LocalDate;
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
import lombok.AccessLevel;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

// Resultado laboratorial do processo (T34, V14): registro critico imutavel.
// Sem setters e com todas as colunas fora do UPDATE; a correcao e outra linha,
// criada por retificar, com `retifica` apontando para esta. O banco recusa
// UPDATE e DELETE (trigger da V14).
@Entity
@Table(name = "resultado_processo")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class ResultadoProcesso {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @EqualsAndHashCode.Include
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processo_id", nullable = false, updatable = false)
    private ProcessoSanitario processo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resultado_laboratorial_id", nullable = false, updatable = false)
    private ResultadoLaboratorial resultadoLaboratorial;

    @Column(name = "data_resultado", nullable = false, updatable = false)
    private LocalDate dataResultado;

    @Column(columnDefinition = "text", updatable = false)
    private String observacoes;

    // Preenchida so no INSERT da linha que corrige outra do mesmo processo
    // (FK composta da V14).
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "retifica_id", updatable = false)
    private ResultadoProcesso retifica;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registrado_por_id", nullable = false, updatable = false)
    private Usuario registradoPor;

    @CreationTimestamp
    @Column(name = "registrado_em", nullable = false, updatable = false)
    private LocalDateTime registradoEm;

    public static ResultadoProcesso registrar(ProcessoSanitario processo, ResultadoLaboratorial resultado,
            LocalDate dataResultado, String observacoes, Usuario autor) {
        return novo(processo, resultado, dataResultado, observacoes, null, autor);
    }

    public static ResultadoProcesso retificar(ResultadoProcesso anterior, ResultadoLaboratorial resultado,
            LocalDate dataResultado, String observacoes, Usuario autor) {
        return novo(anterior.getProcesso(), resultado, dataResultado, observacoes, anterior, autor);
    }

    private static ResultadoProcesso novo(ProcessoSanitario processo, ResultadoLaboratorial resultado,
            LocalDate dataResultado, String observacoes, ResultadoProcesso retifica, Usuario autor) {
        ResultadoProcesso registro = new ResultadoProcesso();
        registro.processo = processo;
        registro.resultadoLaboratorial = resultado;
        registro.dataResultado = dataResultado;
        registro.observacoes = observacoes;
        registro.retifica = retifica;
        registro.registradoPor = autor;
        return registro;
    }
}
