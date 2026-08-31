-- Módulo 2 — Registros clínicos imutáveis (docs/modulo2-animais.dbml:
-- Vacinacao, Procedimento, Prescricao)
--
-- CLAUDE.md (regra crítica): "Registros clínicos ... são IMUTÁVEIS: nunca
-- UPDATE/DELETE. Correção = novo registro + evento de auditoria."
--
-- Mecanismo: cada tabela tem `retifica_id`, uma FK nullable e auto-
-- referenciada, preenchida SÓ no INSERT da linha nova que corrige uma
-- anterior — a linha antiga nunca sofre UPDATE. "Status" (ativo/retificado)
-- é derivado (existe alguma outra linha com retifica_id apontando pra
-- esta?), não armazenado. `uq_<tabela>_retifica_id` garante no banco que
-- cada linha só pode ser retificada uma vez, mesmo sob concorrência
-- (múltiplos NULL são distintos no Postgres — mesma técnica já usada em
-- `animal.microchip`, ver V4).
--
-- FKs para usuario usam ON DELETE SET NULL (mesmo padrão de
-- auditoria_evento.usuario_id em V2): defensivo, já que `usuario` é
-- desativado (ativo=false) e nunca excluído fisicamente neste código-base.

-- ── Vacinação ────────────────────────────────────────────

CREATE TABLE vacinacao (
    id              uuid          NOT NULL DEFAULT gen_random_uuid(),
    animal_id       uuid          NOT NULL,
    vacina_id       uuid          NOT NULL,
    aplicado_por_id uuid,
    data_aplicacao  date          NOT NULL,
    numero_dose     integer,
    dose_quantidade decimal(8,3)  NOT NULL,
    dose_unidade    varchar(30),
    lote            varchar(100),
    observacoes     text,
    retifica_id     uuid,
    criado_em       timestamp     NOT NULL DEFAULT now(),
    CONSTRAINT pk_vacinacao PRIMARY KEY (id),
    CONSTRAINT fk_vacinacao_animal FOREIGN KEY (animal_id) REFERENCES animal (id),
    CONSTRAINT fk_vacinacao_vacina FOREIGN KEY (vacina_id) REFERENCES vacina (id),
    CONSTRAINT fk_vacinacao_usuario FOREIGN KEY (aplicado_por_id) REFERENCES usuario (id) ON DELETE SET NULL,
    CONSTRAINT fk_vacinacao_retifica FOREIGN KEY (retifica_id) REFERENCES vacinacao (id),
    CONSTRAINT uq_vacinacao_retifica_id UNIQUE (retifica_id),
    CONSTRAINT ck_vacinacao_dose_unidade CHECK (dose_unidade IN (
        'MILIGRAMA', 'MICROGRAMA', 'GRAMA', 'MILILITRO', 'UNIDADE_INTERNACIONAL'
    ))
);

CREATE INDEX ix_vacinacao_animal_id ON vacinacao (animal_id);
CREATE INDEX ix_vacinacao_vacina_id ON vacinacao (vacina_id);

-- ── Procedimento ─────────────────────────────────────────

CREATE TABLE procedimento (
    id                    uuid      NOT NULL DEFAULT gen_random_uuid(),
    animal_id             uuid      NOT NULL,
    tipo_procedimento_id  uuid      NOT NULL,
    executado_por_id      uuid,
    data                  date      NOT NULL,
    descricao             text,
    resultado             text,
    retifica_id           uuid,
    criado_em             timestamp NOT NULL DEFAULT now(),
    CONSTRAINT pk_procedimento PRIMARY KEY (id),
    CONSTRAINT fk_procedimento_animal FOREIGN KEY (animal_id) REFERENCES animal (id),
    CONSTRAINT fk_procedimento_tipo_procedimento FOREIGN KEY (tipo_procedimento_id) REFERENCES tipo_procedimento (id),
    CONSTRAINT fk_procedimento_usuario FOREIGN KEY (executado_por_id) REFERENCES usuario (id) ON DELETE SET NULL,
    CONSTRAINT fk_procedimento_retifica FOREIGN KEY (retifica_id) REFERENCES procedimento (id),
    CONSTRAINT uq_procedimento_retifica_id UNIQUE (retifica_id)
);

CREATE INDEX ix_procedimento_animal_id ON procedimento (animal_id);
CREATE INDEX ix_procedimento_tipo_procedimento_id ON procedimento (tipo_procedimento_id);

-- ── Prescrição (Medicação) ───────────────────────────────

CREATE TABLE prescricao (
    id                    uuid          NOT NULL DEFAULT gen_random_uuid(),
    animal_id             uuid          NOT NULL,
    prescrito_por_id      uuid,
    medicamento_id        uuid          NOT NULL,
    data_inicio           date          NOT NULL,
    data_fim_prevista     date,
    data_fim_real         date,
    frequencia_aplicada   integer       NOT NULL,
    unidade_frequencia    varchar(10)   NOT NULL,
    dose_quantidade       decimal(8,3)  NOT NULL,
    dose_unidade          varchar(30)   NOT NULL,
    via_administracao     varchar(20)   NOT NULL,
    status                varchar(20)   NOT NULL,
    retifica_id           uuid,
    criado_em             timestamp     NOT NULL DEFAULT now(),
    CONSTRAINT pk_prescricao PRIMARY KEY (id),
    CONSTRAINT fk_prescricao_animal FOREIGN KEY (animal_id) REFERENCES animal (id),
    CONSTRAINT fk_prescricao_medicamento FOREIGN KEY (medicamento_id) REFERENCES medicamento (id),
    CONSTRAINT fk_prescricao_usuario FOREIGN KEY (prescrito_por_id) REFERENCES usuario (id) ON DELETE SET NULL,
    CONSTRAINT fk_prescricao_retifica FOREIGN KEY (retifica_id) REFERENCES prescricao (id),
    CONSTRAINT uq_prescricao_retifica_id UNIQUE (retifica_id),
    CONSTRAINT ck_prescricao_unidade_frequencia CHECK (unidade_frequencia IN ('HORAS', 'DIAS')),
    CONSTRAINT ck_prescricao_dose_unidade CHECK (dose_unidade IN (
        'MILIGRAMA', 'MICROGRAMA', 'GRAMA', 'MILILITRO', 'UNIDADE_INTERNACIONAL'
    )),
    CONSTRAINT ck_prescricao_via_administracao CHECK (via_administracao IN (
        'ORAL', 'INTRAVENOSA', 'INTRAMUSCULAR', 'SUBCUTANEA', 'TOPICA'
    )),
    CONSTRAINT ck_prescricao_status CHECK (status IN ('ATIVA', 'CONCLUIDA', 'SUSPENSA', 'CANCELADA'))
);

CREATE INDEX ix_prescricao_animal_id ON prescricao (animal_id);
CREATE INDEX ix_prescricao_medicamento_id ON prescricao (medicamento_id);
