package com.siszoo.relatorios.entity;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

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
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// Registro de auditoria de exportacao (DER §3.6, T41): uma linha so e gravada
// quando a exportacao (CSV/PDF) termina com sucesso, na mesma transacao —
// sem campo de status, nao ha estado intermediario "processando"/"erro" a
// persistir. periodoInicio/periodoFim sao sempre concretos (ano/janela ja
// resolvidos pelo FiltroRelatorioResolver antes de chegar aqui).
@Entity
@Table(name = "relatorio_gerado")
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class RelatorioGerado {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @EqualsAndHashCode.Include
    private UUID id;

    @Column(name = "doc_id", nullable = false, unique = true, length = 30)
    private String docId;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_relatorio", nullable = false, length = 30)
    private TipoRelatorio tipoRelatorio;

    @Column(name = "periodo_inicio", nullable = false)
    private LocalDate periodoInicio;

    @Column(name = "periodo_fim", nullable = false)
    private LocalDate periodoFim;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "parametros_jsonb")
    private String parametrosJson;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "gerado_por_id", nullable = false)
    private Usuario geradoPor;

    @Column(name = "gerado_em", nullable = false)
    private OffsetDateTime geradoEm;

    @Column(name = "arquivo_url", columnDefinition = "text")
    private String arquivoUrl;

    @Column(name = "tamanho_bytes")
    private Integer tamanhoBytes;
}
