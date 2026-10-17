-- T29 — Módulo 4: Processos Sanitários, núcleo (docs/DER.md §3.5 e §5
-- regras 14–18; decisões em docs/decisoes/T29.md)
--
-- Fonte do schema: DER §3.5 (o DBML do módulo 4 está desatualizado e
-- schema_processos.sql não existe — mesmo caso da D1 da T25).
--
-- Convenções herdadas de V4–V12:
--   - catálogos como tabela-domínio com `codigo` UNIQUE (V4), seed idempotente
--     com ON CONFLICT DO NOTHING;
--   - enums da aplicação como varchar + CHECK, em maiúsculas (D38). Exceção
--     consciente: sexo e pelagem da amostra reutilizam o domínio de `animal`
--     (V4, minúsculas), porque são snapshot da ficha (DH-9);
--   - FK de autor com ON DELETE RESTRICT (V7); sem CASCADE: não há exclusão de
--     processo (mesmo princípio da D8);
--   - criado_em com DEFAULT now(), preenchido pelo Hibernate (D39); datas de
--     negócio (data_coleta) sem DEFAULT.
--
-- documento_processo fica inteira para a task de documentos (DH-6). Resultado,
-- desfecho, GAL/SINAN e datas de envio/resultado entram como colunas
-- opcionais; o fluxo que as preenche é de tasks seguintes (DH-10).

-- ── Pré-condição (DH-3) ──────────────────────────────────
-- Não há ambiente com dados reais a preservar. Linhas existentes só podem ser
-- processos mínimos da T25 (sem doença, laboratório, responsável e amostras),
-- que não satisfazem as colunas NOT NULL abaixo: em vez de inventar valores,
-- a migration para e pede a recriação do banco de desenvolvimento.

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM processo_sanitario) THEN
        RAISE EXCEPTION 'V13: processo_sanitario contém processos mínimos da T25, sem doença, laboratório, responsável e amostras.'
            USING HINT = 'Não há dados reais a preservar (decisão DH-3 da T29): recrie o banco de desenvolvimento e rode as migrations de novo.';
    END IF;
END
$$;

-- ── Catálogos ────────────────────────────────────────────
-- Tamanhos não dados pelo DER: doenca.nome e cid seguem o DBML do módulo 4;
-- os demais seguem os catálogos de V5/V10 (nome varchar(100)).

CREATE TABLE doenca (
    id     uuid         NOT NULL DEFAULT gen_random_uuid(),
    codigo varchar(30)  NOT NULL,
    nome   varchar(150) NOT NULL,
    cid    varchar(20),
    ativo  boolean      NOT NULL DEFAULT true,
    CONSTRAINT pk_doenca PRIMARY KEY (id),
    CONSTRAINT uq_doenca_codigo UNIQUE (codigo)
);

-- tipo e contato existem no DER, mas sem valor por laboratório: ficam nulos
-- até o CCZ confirmar (DH-8).
CREATE TABLE laboratorio (
    id      uuid         NOT NULL DEFAULT gen_random_uuid(),
    codigo  varchar(30)  NOT NULL,
    nome    varchar(100) NOT NULL,
    tipo    varchar(50),
    contato varchar(255),
    ativo   boolean      NOT NULL DEFAULT true,
    CONSTRAINT pk_laboratorio PRIMARY KEY (id),
    CONSTRAINT uq_laboratorio_codigo UNIQUE (codigo)
);

CREATE TABLE sintoma (
    id     uuid         NOT NULL DEFAULT gen_random_uuid(),
    codigo varchar(30)  NOT NULL,
    nome   varchar(100) NOT NULL,
    ativo  boolean      NOT NULL DEFAULT true,
    CONSTRAINT pk_sintoma PRIMARY KEY (id),
    CONSTRAINT uq_sintoma_codigo UNIQUE (codigo)
);

CREATE TABLE resultado_laboratorial (
    id     uuid         NOT NULL DEFAULT gen_random_uuid(),
    codigo varchar(30)  NOT NULL,
    nome   varchar(100) NOT NULL,
    ativo  boolean      NOT NULL DEFAULT true,
    CONSTRAINT pk_resultado_laboratorial PRIMARY KEY (id),
    CONSTRAINT uq_resultado_laboratorial_codigo UNIQUE (codigo)
);

CREATE TABLE desfecho_animal (
    id     uuid         NOT NULL DEFAULT gen_random_uuid(),
    codigo varchar(30)  NOT NULL,
    nome   varchar(100) NOT NULL,
    ativo  boolean      NOT NULL DEFAULT true,
    CONSTRAINT pk_desfecho_animal PRIMARY KEY (id),
    CONSTRAINT uq_desfecho_animal_codigo UNIQUE (codigo)
);

-- ── Processo sanitário (modelo-alvo do DER §3.5) ─────────
-- A tabela está vazia (pré-condição acima), então as colunas obrigatórias
-- entram NOT NULL sem DEFAULT. status_processo continua varchar + CHECK (V10),
-- não catálogo. urgente é derivado das amostras pelo service (regra 18).
-- cid é snapshot de doenca.cid gravado pelo service na criação: preserva o
-- CID usado na época mesmo que o catálogo mude depois.

ALTER TABLE processo_sanitario
    ADD COLUMN doenca_id                 uuid        NOT NULL,
    ADD COLUMN laboratorio_id            uuid        NOT NULL,
    ADD COLUMN cid                       varchar(20),
    ADD COLUMN gal_numero                varchar(40),
    ADD COLUMN sinan_numero              varchar(40),
    ADD COLUMN data_envio_amostras       timestamp,
    ADD COLUMN previsao_retorno          date,
    ADD COLUMN resultado_laboratorial_id uuid,
    ADD COLUMN data_resultado            date,
    ADD COLUMN desfecho_animal_id        uuid,
    ADD COLUMN observacoes               text,
    ADD CONSTRAINT fk_processo_sanitario_doenca
        FOREIGN KEY (doenca_id) REFERENCES doenca (id),
    ADD CONSTRAINT fk_processo_sanitario_laboratorio
        FOREIGN KEY (laboratorio_id) REFERENCES laboratorio (id),
    ADD CONSTRAINT fk_processo_sanitario_resultado_laboratorial
        FOREIGN KEY (resultado_laboratorial_id) REFERENCES resultado_laboratorial (id),
    ADD CONSTRAINT fk_processo_sanitario_desfecho_animal
        FOREIGN KEY (desfecho_animal_id) REFERENCES desfecho_animal (id);

-- Filtros e ordenação previstos para a listagem (doença, status, data). O
-- índice de ocorrencia_id já vem do UNIQUE da V10.
CREATE INDEX ix_processo_sanitario_doenca_id ON processo_sanitario (doenca_id);
CREATE INDEX ix_processo_sanitario_status_processo ON processo_sanitario (status_processo);
CREATE INDEX ix_processo_sanitario_data_abertura ON processo_sanitario (data_abertura);

-- ── Responsável (munícipe), 1:1 com o processo ──────────
-- Sem UNIQUE(cpf): o mesmo munícipe pode responder por vários processos, cada
-- um com o próprio registro (DER §3.5; o DBML, que reaproveitava por CPF,
-- está desatualizado).

CREATE TABLE responsavel_processo (
    id                 uuid         NOT NULL DEFAULT gen_random_uuid(),
    processo_id        uuid         NOT NULL,
    nome               varchar(150) NOT NULL,
    cpf                varchar(14),
    telefone           varchar(20),
    email              varchar(150),
    cep                varchar(10),
    endereco           varchar(255),
    bairro_residencial varchar(80),
    bairro_ocorrencia  varchar(80),
    CONSTRAINT pk_responsavel_processo PRIMARY KEY (id),
    CONSTRAINT uq_responsavel_processo_processo_id UNIQUE (processo_id),
    CONSTRAINT fk_responsavel_processo_processo FOREIGN KEY (processo_id) REFERENCES processo_sanitario (id),
    CONSTRAINT ck_responsavel_processo_nome CHECK (btrim(nome) <> '')
);

-- ── Animal amostrado ─────────────────────────────────────
-- animal_id NULL = animal de campo (dados próprios); preenchido = animal do
-- canil, com a identificação copiada da ficha pelo service no momento da
-- amostragem (snapshot, DH-5). Os campos clínicos são sempre da amostra e
-- nunca relidos da ficha (regra 17).

CREATE TABLE animal_amostrado (
    id                       uuid         NOT NULL DEFAULT gen_random_uuid(),
    processo_id              uuid         NOT NULL,
    animal_id                uuid,
    especie_id               uuid         NOT NULL,
    sexo                     varchar(20)  NOT NULL,
    raca                     varchar(80),
    coloracao                varchar(80),
    pelagem                  varchar(10),
    idade_aprox              varchar(30),
    peso_kg                  decimal(5,2),
    status_clinico           varchar(20)  NOT NULL,
    tipo_abrigo              varchar(20)  NOT NULL,
    alteracao_comportamental text,
    data_coleta              date         NOT NULL,
    material_biologico       varchar(20)  NOT NULL,
    contato_humano           boolean      NOT NULL,
    nivel_contato            varchar(10),
    agrediu_humano           boolean,
    observacoes              text,
    criado_em                timestamp    NOT NULL DEFAULT now(),
    CONSTRAINT pk_animal_amostrado PRIMARY KEY (id),
    CONSTRAINT fk_animal_amostrado_processo FOREIGN KEY (processo_id) REFERENCES processo_sanitario (id),
    CONSTRAINT fk_animal_amostrado_animal FOREIGN KEY (animal_id) REFERENCES animal (id) ON DELETE RESTRICT,
    CONSTRAINT fk_animal_amostrado_especie FOREIGN KEY (especie_id) REFERENCES especie (id),
    -- Mesmo domínio de animal (V4), em minúsculas (DH-9).
    CONSTRAINT ck_animal_amostrado_sexo CHECK (sexo IN ('macho', 'femea', 'nao_identificado')),
    CONSTRAINT ck_animal_amostrado_pelagem CHECK (pelagem IN ('curta', 'longa')),
    CONSTRAINT ck_animal_amostrado_peso_kg CHECK (peso_kg > 0),
    CONSTRAINT ck_animal_amostrado_status_clinico CHECK (status_clinico IN ('SINTOMATICO', 'ASSINTOMATICO', 'OBITO')),
    CONSTRAINT ck_animal_amostrado_tipo_abrigo CHECK (tipo_abrigo IN (
        'INTRADOMICILIAR', 'PERIDOMICILIAR', 'SILVESTRE', 'NAO_IDENTIFICADO'
    )),
    CONSTRAINT ck_animal_amostrado_material_biologico CHECK (material_biologico IN (
        'TECIDO_ENCEFALICO', 'SORO', 'SANGUE', 'SALIVA', 'URINA'
    )),
    CONSTRAINT ck_animal_amostrado_nivel_contato CHECK (nivel_contato IN ('DIRETA', 'INDIRETA')),
    -- Nível de contato e agressão existem se, e somente se, houve contato
    -- humano (DER §3.5; o front já exige os dois quando há contato).
    CONSTRAINT ck_animal_amostrado_contato CHECK (
        (contato_humano AND nivel_contato IS NOT NULL AND agrediu_humano IS NOT NULL)
        OR
        (NOT contato_humano AND nivel_contato IS NULL AND agrediu_humano IS NULL)
    )
);

CREATE INDEX ix_animal_amostrado_processo_id ON animal_amostrado (processo_id);
CREATE INDEX ix_animal_amostrado_animal_id ON animal_amostrado (animal_id);

-- Sintomas só em amostra SINTOMATICO: regra entre duas tabelas, garantida no
-- service (422).
CREATE TABLE amostra_sintoma (
    animal_amostrado_id uuid NOT NULL,
    sintoma_id          uuid NOT NULL,
    CONSTRAINT pk_amostra_sintoma PRIMARY KEY (animal_amostrado_id, sintoma_id),
    CONSTRAINT fk_amostra_sintoma_animal_amostrado FOREIGN KEY (animal_amostrado_id) REFERENCES animal_amostrado (id),
    CONSTRAINT fk_amostra_sintoma_sintoma FOREIGN KEY (sintoma_id) REFERENCES sintoma (id)
);

CREATE INDEX ix_amostra_sintoma_sintoma_id ON amostra_sintoma (sintoma_id);

-- ── Processo completo: 1 responsável e ≥ 1 amostra (DH-2) ─
-- Uma FK não garante a existência do filho. Constraint triggers adiáveis
-- (PostgreSQL 16, CREATE TRIGGER: AFTER ROW, disparados no fim da transação)
-- conferem no COMMIT que todo processo existente tem responsável e amostra:
--   - na criação do processo (o processo é inserido antes dos filhos);
--   - ao remover (ou mover para outro processo) a última amostra ou o
--     responsável.
-- Um processo removido na mesma transação não é cobrado. As funções travam a
-- linha do processo antes de contar: duas transações que removem amostras
-- diferentes do mesmo processo não passam juntas pela verificação.
-- O SQLSTATE 23514 (check_violation) chega à aplicação como
-- DataIntegrityViolationException (409 genérico, GlobalExceptionHandler); o
-- caminho normal é barrado antes, no DTO/service (422). O service antecipa a
-- verificação com SET CONSTRAINTS ALL IMMEDIATE, para a violação aparecer
-- dentro dele e não no COMMIT.
--
-- SET search_path FROM CURRENT: as funções resolvem as tabelas no schema em
-- que foram criadas (o da migration), não no search_path de quem dispara o
-- trigger.

CREATE FUNCTION fn_processo_sanitario_completo() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path FROM CURRENT
    AS $$
BEGIN
    PERFORM 1 FROM processo_sanitario WHERE id = NEW.id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM responsavel_processo WHERE processo_id = NEW.id) THEN
        RAISE EXCEPTION 'Processo sanitário % sem responsável', NEW.id
            USING ERRCODE = 'check_violation', CONSTRAINT = 'ck_processo_sanitario_responsavel';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM animal_amostrado WHERE processo_id = NEW.id) THEN
        RAISE EXCEPTION 'Processo sanitário % sem animal amostrado', NEW.id
            USING ERRCODE = 'check_violation', CONSTRAINT = 'ck_processo_sanitario_amostra';
    END IF;
    RETURN NULL;
END
$$;

CREATE CONSTRAINT TRIGGER tg_processo_sanitario_completo
    AFTER INSERT ON processo_sanitario
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION fn_processo_sanitario_completo();

CREATE FUNCTION fn_animal_amostrado_minimo() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path FROM CURRENT
    AS $$
BEGIN
    PERFORM 1 FROM processo_sanitario WHERE id = OLD.processo_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM animal_amostrado WHERE processo_id = OLD.processo_id) THEN
        RAISE EXCEPTION 'Processo sanitário % ficaria sem animal amostrado', OLD.processo_id
            USING ERRCODE = 'check_violation', CONSTRAINT = 'ck_processo_sanitario_amostra';
    END IF;
    RETURN NULL;
END
$$;

CREATE CONSTRAINT TRIGGER tg_animal_amostrado_minimo
    AFTER DELETE OR UPDATE OF processo_id ON animal_amostrado
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION fn_animal_amostrado_minimo();

CREATE FUNCTION fn_responsavel_processo_obrigatorio() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path FROM CURRENT
    AS $$
BEGIN
    PERFORM 1 FROM processo_sanitario WHERE id = OLD.processo_id FOR UPDATE;
    IF NOT FOUND THEN
        RETURN NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM responsavel_processo WHERE processo_id = OLD.processo_id) THEN
        RAISE EXCEPTION 'Processo sanitário % ficaria sem responsável', OLD.processo_id
            USING ERRCODE = 'check_violation', CONSTRAINT = 'ck_processo_sanitario_responsavel';
    END IF;
    RETURN NULL;
END
$$;

CREATE CONSTRAINT TRIGGER tg_responsavel_processo_obrigatorio
    AFTER DELETE OR UPDATE OF processo_id ON responsavel_processo
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION fn_responsavel_processo_obrigatorio();

-- ── Vínculo com a ocorrência imutável (regra 15, DH-1/DH-7) ─
-- O vínculo pode ser definido uma única vez: na criação (etapa 1) ou depois,
-- se o processo ainda não tiver (emenda de 2026-10-03), ou seja, NULL → valor.
-- Uma vez definido, trocar ou remover é recusado para qualquer caminho e
-- qualquer usuário, inclusive SQL manual; não há exceção para administrador.
-- O service já recusa antes (VinculoJaExistenteException, 409); o trigger é a
-- última barreira.

CREATE FUNCTION fn_processo_sanitario_vinculo_imutavel() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path FROM CURRENT
    AS $$
BEGIN
    RAISE EXCEPTION 'O vínculo do processo sanitário % com a ocorrência % é imutável', OLD.id, OLD.ocorrencia_id
        USING ERRCODE = 'check_violation', CONSTRAINT = 'ck_processo_sanitario_vinculo_imutavel';
END
$$;

CREATE TRIGGER tg_processo_sanitario_vinculo_imutavel
    BEFORE UPDATE OF ocorrencia_id ON processo_sanitario
    FOR EACH ROW
    WHEN (OLD.ocorrencia_id IS NOT NULL AND NEW.ocorrencia_id IS DISTINCT FROM OLD.ocorrencia_id)
    EXECUTE FUNCTION fn_processo_sanitario_vinculo_imutavel();

-- ── Seed dos catálogos (DER §3.5 e §6) ───────────────────

INSERT INTO doenca (codigo, nome, cid) VALUES
    ('raiva', 'Raiva', 'A82'),
    ('esporotricose', 'Esporotricose', 'B42'),
    ('leishmaniose_visceral', 'Leishmaniose Visceral', 'B55.0'),
    ('leptospirose', 'Leptospirose', 'A27'),
    ('febre_maculosa', 'Febre Maculosa', 'A77'),
    ('febre_amarela', 'Febre Amarela', 'A95')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO laboratorio (codigo, nome) VALUES
    ('pasteur_sp', 'Pasteur — SP'),
    ('ial_sorocaba', 'IAL — Sorocaba'),
    ('ccz_sp', 'CCZ — SP'),
    ('itu_ll01', 'ITU-LL01')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO sintoma (codigo, nome) VALUES
    ('apatia', 'Apatia'),
    ('alt_comportamental', 'Alt. comportamental'),
    ('descamacao', 'Descamação'),
    ('ulcera_pele', 'Úlcera de pele'),
    ('ceratoconjuntivite', 'Ceratoconjuntivite'),
    ('coriza', 'Coriza'),
    ('emagrecimento', 'Emagrecimento'),
    ('diarreia', 'Diarreia'),
    ('salivacao_excessiva', 'Salivação excessiva'),
    ('hemorragia_interna', 'Hemorragia interna'),
    ('vomito', 'Vômito'),
    ('aumento_linfonodo', 'Aumento de linfonodo')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO resultado_laboratorial (codigo, nome) VALUES
    ('aguardando', 'Aguardando'),
    ('positivo', 'Positivo'),
    ('negativo', 'Negativo'),
    ('inconclusivo', 'Inconclusivo'),
    ('material_inadequado', 'Material Inadequado'),
    ('nao_realizado', 'Não Realizado')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO desfecho_animal (codigo, nome) VALUES
    ('em_acompanhamento', 'Em acompanhamento'),
    ('obito_natural', 'Óbito natural'),
    ('obito_eutanasia', 'Óbito eutanásia'),
    ('obito_outro', 'Óbito outro')
ON CONFLICT (codigo) DO NOTHING;
