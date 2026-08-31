-- Módulo 2 — Catálogos clínicos (docs/modulo2-animais.dbml: Vacina,
-- TipoProcedimento, CategoriaFarmacologica, Medicamento)
--
-- Mesma técnica de tabela-domínio já usada em V4 (especie/status_animal/
-- motivo_entrada/tipo_baia): integridade referencial via FK, sem enum nativo
-- do Postgres nem CHECK/varchar hardcoded para valores de catálogo.

-- ── Vacina ───────────────────────────────────────────────

CREATE TABLE vacina (
    id              uuid         NOT NULL DEFAULT gen_random_uuid(),
    codigo          varchar(30)  NOT NULL,
    nome            varchar(100) NOT NULL,
    intervalo_meses integer,
    ativo           boolean      NOT NULL DEFAULT true,
    CONSTRAINT pk_vacina PRIMARY KEY (id),
    CONSTRAINT uq_vacina_codigo UNIQUE (codigo)
);

-- ── TipoProcedimento ─────────────────────────────────────
-- `codigo` não está em docs/modulo2-animais.dbml (só id/nome/ativo), mas é
-- adicionado aqui para manter 100% de consistência com o padrão de todo
-- catálogo já existente no projeto (especie, status_animal, motivo_entrada,
-- tipo_baia, vacina — todos resolvidos por código estável no request, nunca
-- por nome livre) e porque docs/DER.md §"tipo_procedimento (catálogo)" já
-- define os 4 códigos de seed abaixo.

CREATE TABLE tipo_procedimento (
    id     uuid         NOT NULL DEFAULT gen_random_uuid(),
    codigo varchar(30)  NOT NULL,
    nome   varchar(100) NOT NULL,
    ativo  boolean      NOT NULL DEFAULT true,
    CONSTRAINT pk_tipo_procedimento PRIMARY KEY (id),
    CONSTRAINT uq_tipo_procedimento_codigo UNIQUE (codigo)
);

-- ── CategoriaFarmacologica / Medicamento ─────────────────
-- Sem `codigo`: nem DER.md nem o dbml dão uma lista de códigos estáveis
-- para categorias/medicamentos (ao contrário de vacina/tipo_procedimento),
-- então são referenciados por uuid cru no request (mesmo padrão já usado
-- para `baia_id` em CriarAnimalRequest), evitando inventar um vocabulário
-- de códigos sem lastro em documento.

CREATE TABLE categoria_farmacologica (
    id    uuid         NOT NULL DEFAULT gen_random_uuid(),
    nome  varchar(100) NOT NULL,
    ativo boolean      NOT NULL DEFAULT true,
    CONSTRAINT pk_categoria_farmacologica PRIMARY KEY (id),
    CONSTRAINT uq_categoria_farmacologica_nome UNIQUE (nome)
);

CREATE TABLE medicamento (
    id           uuid         NOT NULL DEFAULT gen_random_uuid(),
    nome         varchar(100) NOT NULL,
    categoria_id uuid         NOT NULL,
    ativo        boolean      NOT NULL DEFAULT true,
    CONSTRAINT pk_medicamento PRIMARY KEY (id),
    CONSTRAINT fk_medicamento_categoria_farmacologica FOREIGN KEY (categoria_id)
        REFERENCES categoria_farmacologica (id)
);

CREATE INDEX ix_medicamento_categoria_id ON medicamento (categoria_id);

-- ── Seed (docs/DER.md §3.2 "vacina" / §"tipo_procedimento (catálogo)") ──

-- intervalo_meses=12 (reforço anual) para as 8 vacinas: nem DER.md nem o
-- dbml trazem o intervalo real por vacina. 12 meses é a prática padrão de
-- campanhas municipais de vacinação no Brasil (antirrábica: Programa
-- Nacional de Profilaxia da Raiva; polivalentes: prática usual de CCZ/
-- abrigos, distinta da diretriz WSAVA de até 3 anos, que é voltada a
-- clínica particular de pequenos animais, não a controle populacional).
-- CONFIRMAR com a equipe veterinária do CCZ antes de uso em produção.
INSERT INTO vacina (codigo, nome, intervalo_meses) VALUES
    ('antirrabica', 'Antirrábica', 12),
    ('v10', 'V10', 12),
    ('v8', 'V8', 12),
    ('v4_felinos', 'V4 (felinos)', 12),
    ('giardia', 'Giárdia', 12),
    ('gripe_canina', 'Gripe canina', 12),
    ('felv', 'FeLV', 12),
    ('leishmaniose', 'Leishmaniose', 12)
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO tipo_procedimento (codigo, nome) VALUES
    ('atendimento_clinico', 'Atendimento clínico'),
    ('castracao', 'Castração'),
    ('cirurgia_maior', 'Cirurgia maior'),
    ('vacinacao', 'Vacinação')
ON CONFLICT (codigo) DO NOTHING;

-- Sem seed em categoria_farmacologica/medicamento (schema-only — ver
-- comentário acima).
