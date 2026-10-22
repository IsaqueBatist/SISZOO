-- T41 — Módulo 5: Relatórios (docs/DER.md §3.6)
--
-- tipo_relatorio como varchar + CHECK (nao FK para catalogo): os 6 valores
-- sao fixos e cada um exige uma classe de agregacao propria no backend — uma
-- tabela catalogo so para isso seria sobre-engenharia (divergencia
-- documentada no DER, mesmo padrao de aviso ja usado para o modulo 4).
-- Sem coluna de status: uma linha so e gravada quando a exportacao (CSV/PDF)
-- termina com sucesso, na mesma transacao. periodo_inicio/periodo_fim sao
-- obrigatorios — filtros por ano ou janela relativa sao resolvidos para datas
-- concretas antes de salvar. doc_id reaproveita o protocolo_sequencia
-- (ProtocoloService), que ja gera o protocolo NNN/AAAA de ocorrencia/processo.

ALTER TABLE protocolo_sequencia DROP CONSTRAINT ck_protocolo_sequencia_entidade;
ALTER TABLE protocolo_sequencia ADD CONSTRAINT ck_protocolo_sequencia_entidade
    CHECK (entidade IN ('OCORRENCIA', 'PROCESSO', 'RELATORIO'));

CREATE TABLE relatorio_gerado (
    id              uuid         NOT NULL DEFAULT gen_random_uuid(),
    doc_id          varchar(30)  NOT NULL,
    tipo_relatorio  varchar(30)  NOT NULL,
    periodo_inicio  date         NOT NULL,
    periodo_fim     date         NOT NULL,
    parametros_jsonb jsonb,
    gerado_por_id   uuid         NOT NULL,
    gerado_em       timestamptz  NOT NULL,
    arquivo_url     text,
    tamanho_bytes   integer,
    CONSTRAINT pk_relatorio_gerado PRIMARY KEY (id),
    CONSTRAINT uq_relatorio_gerado_doc_id UNIQUE (doc_id),
    CONSTRAINT ck_relatorio_gerado_tipo CHECK (tipo_relatorio IN (
        'ANUAL_PROCESSOS', 'VACINACAO', 'ADOCOES', 'PROCEDIMENTOS', 'OCUPACAO_BAIAS', 'OCORRENCIAS_BAIRRO')),
    CONSTRAINT ck_relatorio_gerado_periodo CHECK (periodo_inicio <= periodo_fim),
    CONSTRAINT fk_relatorio_gerado_gerado_por FOREIGN KEY (gerado_por_id) REFERENCES usuario (id) ON DELETE RESTRICT
);

-- Histórico paginado ("Relatórios recentes"), ordenado do mais recente.
CREATE INDEX ix_relatorio_gerado_gerado_em ON relatorio_gerado (gerado_em DESC);
