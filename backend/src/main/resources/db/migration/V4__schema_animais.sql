-- Módulo 2 — Animais (docs/DER.md §3.2 animal, §3.3 baia/tipo_baia, §6 catálogos)
--
-- Catálogos (especie, status_animal, motivo_entrada, tipo_baia) são modelados como
-- tabelas-domínio (lookup tables), não como enum nativo do Postgres nem CHECK/varchar
-- hardcoded: Elmasri & Navathe, "Fundamentals of Database Systems" — integridade
-- referencial via FK para tabela-domínio garante normalização e evita reescrever
-- constraints/deploy de código a cada novo valor de catálogo.

-- ── Catálogos ────────────────────────────────────────────

CREATE TABLE especie (
    id     uuid        NOT NULL DEFAULT gen_random_uuid(),
    codigo varchar(30) NOT NULL,
    nome   varchar(60) NOT NULL,
    CONSTRAINT pk_especie PRIMARY KEY (id),
    CONSTRAINT uq_especie_codigo UNIQUE (codigo)
);

CREATE TABLE status_animal (
    id     uuid        NOT NULL DEFAULT gen_random_uuid(),
    codigo varchar(30) NOT NULL,
    nome   varchar(60) NOT NULL,
    CONSTRAINT pk_status_animal PRIMARY KEY (id),
    CONSTRAINT uq_status_animal_codigo UNIQUE (codigo)
);

CREATE TABLE motivo_entrada (
    id     uuid        NOT NULL DEFAULT gen_random_uuid(),
    codigo varchar(30) NOT NULL,
    nome   varchar(60) NOT NULL,
    CONSTRAINT pk_motivo_entrada PRIMARY KEY (id),
    CONSTRAINT uq_motivo_entrada_codigo UNIQUE (codigo)
);

CREATE TABLE tipo_baia (
    id     uuid        NOT NULL DEFAULT gen_random_uuid(),
    codigo varchar(30) NOT NULL,
    nome   varchar(60) NOT NULL,
    CONSTRAINT pk_tipo_baia PRIMARY KEY (id),
    CONSTRAINT uq_tipo_baia_codigo UNIQUE (codigo)
);

-- ── Baia ─────────────────────────────────────────────────
-- id como uuid (não smallint, divergindo do DER §3.3) para manter a convenção
-- 100% uuid já usada em todas as tabelas do projeto (V1/V2), inclusive no
-- lookup mais próximo (cargo).

CREATE TABLE baia (
    id           uuid        NOT NULL DEFAULT gen_random_uuid(),
    nome         varchar(40) NOT NULL,
    tipo_baia_id uuid        NOT NULL,
    capacidade   smallint    NOT NULL,
    finalidade   varchar(80),
    ativa        boolean     NOT NULL DEFAULT true,
    observacoes  text,
    CONSTRAINT pk_baia PRIMARY KEY (id),
    CONSTRAINT fk_baia_tipo_baia FOREIGN KEY (tipo_baia_id) REFERENCES tipo_baia (id)
);

CREATE INDEX ix_baia_tipo_baia_id ON baia (tipo_baia_id);

-- atual_ocupacao NÃO é coluna: DER §3.3 a define como campo computado (view),
-- derivado de count(animal where baia_id = X and status_animal != 'adotado'/'obito').

-- ── Animal ───────────────────────────────────────────────

CREATE TABLE animal (
    id                    uuid          NOT NULL DEFAULT gen_random_uuid(),
    nome                  varchar(80)   NOT NULL,
    especie_id            uuid          NOT NULL,
    sexo                  varchar(20)   NOT NULL,
    raca                  varchar(80),
    coloracao             varchar(80),
    pelagem               varchar(10),
    porte                 varchar(10),
    peso_kg               decimal(5,2),
    idade_aprox           varchar(30),
    data_nascimento_aprox date,
    microchip             varchar(30),
    esterilizado          boolean       NOT NULL DEFAULT false,
    data_esterilizacao    date,
    status_id             uuid          NOT NULL,
    motivo_entrada_id     uuid          NOT NULL,
    data_entrada          timestamp     NOT NULL,
    baia_id               uuid,
    ficha_completa        boolean       NOT NULL DEFAULT false,
    foto_url              text,
    observacoes           text,
    criado_por_id         uuid          NOT NULL,
    criado_em             timestamp     NOT NULL DEFAULT now(),
    atualizado_em         timestamp     NOT NULL DEFAULT now(),
    CONSTRAINT pk_animal PRIMARY KEY (id),
    -- PostgreSQL 16 (Constraints/Indexes): UNIQUE sobre coluna nullable trata
    -- múltiplos NULL como distintos, satisfazendo "microchip único quando
    -- informado" (DER §3.2) sem precisar de índice parcial.
    CONSTRAINT uq_animal_microchip UNIQUE (microchip),
    CONSTRAINT fk_animal_especie FOREIGN KEY (especie_id) REFERENCES especie (id),
    CONSTRAINT fk_animal_status_animal FOREIGN KEY (status_id) REFERENCES status_animal (id),
    CONSTRAINT fk_animal_motivo_entrada FOREIGN KEY (motivo_entrada_id) REFERENCES motivo_entrada (id),
    -- baia_id é a única FK opcional do schema: NULL representa animal em trânsito
    -- (DER §3.2). ON DELETE SET NULL preserva o animal se a baia for removida.
    CONSTRAINT fk_animal_baia FOREIGN KEY (baia_id) REFERENCES baia (id) ON DELETE SET NULL,
    CONSTRAINT fk_animal_usuario FOREIGN KEY (criado_por_id) REFERENCES usuario (id),
    CONSTRAINT ck_animal_sexo CHECK (sexo IN ('macho', 'femea', 'nao_identificado')),
    CONSTRAINT ck_animal_pelagem CHECK (pelagem IN ('curta', 'longa')),
    CONSTRAINT ck_animal_porte CHECK (porte IN ('pequeno', 'medio', 'grande'))
);

CREATE INDEX ix_animal_especie_id ON animal (especie_id);
CREATE INDEX ix_animal_status_id ON animal (status_id);
CREATE INDEX ix_animal_motivo_entrada_id ON animal (motivo_entrada_id);
CREATE INDEX ix_animal_baia_id ON animal (baia_id);
CREATE INDEX ix_animal_criado_por_id ON animal (criado_por_id);

-- ── Seed dos catálogos (DER.md §6) ──────────────────────

INSERT INTO especie (codigo, nome) VALUES
    ('canino', 'Canino'),
    ('felino', 'Felino'),
    ('quiroptero', 'Quiróptero'),
    ('pnh', 'Primata não-humano')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO status_animal (codigo, nome) VALUES
    ('disponivel_adocao', 'Disponível'),
    ('em_tratamento', 'Em tratamento'),
    ('em_quarentena', 'Em quarentena'),
    ('adotado', 'Adotado'),
    ('obito_natural', 'Óbito natural'),
    ('obito_eutanasia', 'Óbito eutanásia'),
    ('transferido', 'Transferido')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO motivo_entrada (codigo, nome) VALUES
    ('recolhimento', 'Recolhimento'),
    ('abandono', 'Abandono'),
    ('entrega_voluntaria', 'Entrega voluntária'),
    ('resgate', 'Resgate'),
    ('apreensao_judicial', 'Apreensão judicial')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO tipo_baia (codigo, nome) VALUES
    ('interna', 'Interna'),
    ('gatil', 'Gatil'),
    ('externa', 'Externa')
ON CONFLICT (codigo) DO NOTHING;
