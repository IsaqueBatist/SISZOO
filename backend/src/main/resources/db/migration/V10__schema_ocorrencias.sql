-- T25 — Módulo 3: Ocorrências e Denúncias (docs/DER.md §3.4, plano T25 rev. 10)
--
-- Fonte do schema: DER §3.4 (decisão D1). Divergências deliberadas em relação
-- ao DER estão listadas na seção 7 do plano e no DER atualizado neste PR.
--
-- Convenções herdadas de V4–V7:
--   - catálogos como tabela-domínio com `codigo` UNIQUE (V4), seed idempotente
--     com ON CONFLICT DO NOTHING;
--   - enums da aplicação como varchar + CHECK, em maiúsculas (V6);
--   - autor de registro histórico com FK ON DELETE RESTRICT (V7);
--   - criado_em/atualizado_em com DEFAULT now() (V2/V4/V6), preenchidos pelas
--     entidades com @CreationTimestamp/@UpdateTimestamp; datas de negócio
--     (encerrada_em, movimentacao.data) não têm DEFAULT e são gravadas pelo
--     service com o Clock do projeto, como usuario.desativado_em.
--
-- Não há exclusão de ocorrência (D8): as FKs para `ocorrencia` usam o padrão
-- (NO ACTION), sem CASCADE.

-- ── Catálogos ────────────────────────────────────────────

CREATE TABLE tipo_ocorrencia (
    id     uuid         NOT NULL DEFAULT gen_random_uuid(),
    codigo varchar(30)  NOT NULL,
    nome   varchar(100) NOT NULL,
    ativo  boolean      NOT NULL DEFAULT true,
    CONSTRAINT pk_tipo_ocorrencia PRIMARY KEY (id),
    CONSTRAINT uq_tipo_ocorrencia_codigo UNIQUE (codigo)
);

CREATE TABLE providencia_tomada (
    id     uuid         NOT NULL DEFAULT gen_random_uuid(),
    codigo varchar(30)  NOT NULL,
    nome   varchar(100) NOT NULL,
    ativo  boolean      NOT NULL DEFAULT true,
    CONSTRAINT pk_providencia_tomada PRIMARY KEY (id),
    CONSTRAINT uq_providencia_tomada_codigo UNIQUE (codigo)
);

-- ── Sequência de protocolo ───────────────────────────────
-- Uma sequência por ano e por entidade: ocorrência e processo numeram de forma
-- independente (as duas podem ter "015/2026"). A unicidade final é garantida
-- por UNIQUE(protocolo) em cada tabela, não entre elas. A geração usa
-- INSERT ... ON CONFLICT (entidade, ano) DO UPDATE ... RETURNING na mesma
-- transação da criação: um rollback desfaz também o incremento (D13).

CREATE TABLE protocolo_sequencia (
    entidade varchar(20) NOT NULL,
    ano      integer     NOT NULL,
    ultimo   integer     NOT NULL,
    CONSTRAINT pk_protocolo_sequencia PRIMARY KEY (entidade, ano),
    CONSTRAINT ck_protocolo_sequencia_entidade CHECK (entidade IN ('OCORRENCIA', 'PROCESSO')),
    CONSTRAINT ck_protocolo_sequencia_ultimo CHECK (ultimo > 0)
);

-- ── Ocorrência ───────────────────────────────────────────

CREATE TABLE ocorrencia (
    id                     uuid          NOT NULL DEFAULT gen_random_uuid(),
    protocolo              varchar(20)   NOT NULL,
    tipo_ocorrencia_id     uuid          NOT NULL,
    status_ocorrencia      varchar(20)   NOT NULL DEFAULT 'ABERTA',
    data_abertura          date          NOT NULL,
    hora_abertura          time,
    endereco               varchar(255)  NOT NULL,
    bairro                 varchar(80)   NOT NULL,
    ponto_referencia       varchar(255),
    descricao              text          NOT NULL,
    urgente                boolean       NOT NULL DEFAULT false,
    sigilosa               boolean       NOT NULL DEFAULT false,
    anonima                boolean       NOT NULL DEFAULT false,
    latitude               decimal(9,6),
    longitude              decimal(9,6),
    registrado_por_id      uuid          NOT NULL,
    providencia_tomada_id  uuid,
    descricao_encerramento text,
    encerrada_em           timestamp,
    encerrada_por_id       uuid,
    criado_em              timestamp     NOT NULL DEFAULT now(),
    atualizado_em          timestamp     NOT NULL DEFAULT now(),
    CONSTRAINT pk_ocorrencia PRIMARY KEY (id),
    CONSTRAINT uq_ocorrencia_protocolo UNIQUE (protocolo),
    CONSTRAINT fk_ocorrencia_tipo_ocorrencia FOREIGN KEY (tipo_ocorrencia_id) REFERENCES tipo_ocorrencia (id),
    CONSTRAINT fk_ocorrencia_providencia_tomada FOREIGN KEY (providencia_tomada_id) REFERENCES providencia_tomada (id),
    CONSTRAINT fk_ocorrencia_registrado_por FOREIGN KEY (registrado_por_id) REFERENCES usuario (id) ON DELETE RESTRICT,
    CONSTRAINT fk_ocorrencia_encerrada_por FOREIGN KEY (encerrada_por_id) REFERENCES usuario (id) ON DELETE RESTRICT,
    CONSTRAINT ck_ocorrencia_status CHECK (status_ocorrencia IN ('ABERTA', 'EM_ATENDIMENTO', 'ENCERRADA')),
    -- D25/D29: os campos de encerramento existem se, e somente se, a
    -- ocorrência está encerrada. descricao_encerramento é opcional quando
    -- ENCERRADA (a obrigatoriedade com providência "outro" fica no service).
    CONSTRAINT ck_ocorrencia_encerramento CHECK (
        (status_ocorrencia = 'ENCERRADA'
            AND providencia_tomada_id IS NOT NULL
            AND encerrada_em IS NOT NULL
            AND encerrada_por_id IS NOT NULL)
        OR
        (status_ocorrencia <> 'ENCERRADA'
            AND providencia_tomada_id IS NULL
            AND encerrada_em IS NULL
            AND encerrada_por_id IS NULL
            AND descricao_encerramento IS NULL)
    ),
    -- D32: anônima (ninguém sabe quem denunciou) e sigilosa (o CCZ sabe e
    -- protege) são excludentes. "Anônima não tem linha em denunciante" envolve
    -- duas tabelas e é garantido no service.
    CONSTRAINT ck_ocorrencia_anonima_sigilosa CHECK (NOT (anonima AND sigilosa)),
    -- Faixas geográficas válidas; nulos permitidos (coordenadas opcionais).
    CONSTRAINT ck_ocorrencia_latitude CHECK (latitude BETWEEN -90 AND 90),
    CONSTRAINT ck_ocorrencia_longitude CHECK (longitude BETWEEN -180 AND 180)
);

CREATE INDEX ix_ocorrencia_status_ocorrencia ON ocorrencia (status_ocorrencia);
CREATE INDEX ix_ocorrencia_tipo_ocorrencia_id ON ocorrencia (tipo_ocorrencia_id);
CREATE INDEX ix_ocorrencia_data_abertura ON ocorrencia (data_abertura);
CREATE INDEX ix_ocorrencia_registrado_por_id ON ocorrencia (registrado_por_id);

-- ── Partes envolvidas (1:0..1 com a ocorrência) ──────────
-- Tamanhos do denunciante conforme DER §3.4. O DER não dá tamanhos para o
-- denunciado; usados os mesmos do denunciante para os campos equivalentes
-- (registrado como divergência na seção 7 do plano / DER atualizado).

CREATE TABLE denunciante (
    id                 uuid         NOT NULL DEFAULT gen_random_uuid(),
    ocorrencia_id      uuid         NOT NULL,
    nome               varchar(150),
    cpf                varchar(14),
    telefone           varchar(20),
    email              varchar(150),
    cep                varchar(10),
    endereco           varchar(255),
    bairro_residencial varchar(80),
    CONSTRAINT pk_denunciante PRIMARY KEY (id),
    CONSTRAINT uq_denunciante_ocorrencia_id UNIQUE (ocorrencia_id),
    CONSTRAINT fk_denunciante_ocorrencia FOREIGN KEY (ocorrencia_id) REFERENCES ocorrencia (id)
);

CREATE TABLE denunciado (
    id            uuid         NOT NULL DEFAULT gen_random_uuid(),
    ocorrencia_id uuid         NOT NULL,
    nome          varchar(150),
    cpf           varchar(14),
    telefone      varchar(20),
    endereco      varchar(255),
    observacoes   text,
    CONSTRAINT pk_denunciado PRIMARY KEY (id),
    CONSTRAINT uq_denunciado_ocorrencia_id UNIQUE (ocorrencia_id),
    CONSTRAINT fk_denunciado_ocorrencia FOREIGN KEY (ocorrencia_id) REFERENCES ocorrencia (id)
);

-- ── Processo sanitário (mínimo, D2/D18) ──────────────────
-- Versão mínima para o vínculo opcional com a ocorrência. Doença,
-- laboratório, resultado, amostras e documentos ficam para a task de
-- processos. O vínculo mora só aqui (ocorrencia_id UNIQUE NULL): o lado da
-- ocorrência é derivado por join, sem FK circular (D2).

CREATE TABLE processo_sanitario (
    id              uuid        NOT NULL DEFAULT gen_random_uuid(),
    protocolo       varchar(20) NOT NULL,
    data_abertura   date        NOT NULL,
    ocorrencia_id   uuid,
    urgente         boolean     NOT NULL DEFAULT false,
    status_processo varchar(30) NOT NULL DEFAULT 'ABERTO',
    criado_por_id   uuid        NOT NULL,
    criado_em       timestamp   NOT NULL DEFAULT now(),
    atualizado_em   timestamp   NOT NULL DEFAULT now(),
    CONSTRAINT pk_processo_sanitario PRIMARY KEY (id),
    CONSTRAINT uq_processo_sanitario_protocolo UNIQUE (protocolo),
    CONSTRAINT uq_processo_sanitario_ocorrencia_id UNIQUE (ocorrencia_id),
    CONSTRAINT fk_processo_sanitario_ocorrencia FOREIGN KEY (ocorrencia_id) REFERENCES ocorrencia (id),
    CONSTRAINT fk_processo_sanitario_criado_por FOREIGN KEY (criado_por_id) REFERENCES usuario (id) ON DELETE RESTRICT,
    CONSTRAINT ck_processo_sanitario_status CHECK (status_processo IN (
        'ABERTO', 'AGUARDANDO_RESULTADO', 'COM_RESULTADO', 'CONCLUIDO'
    ))
);

CREATE INDEX ix_processo_sanitario_criado_por_id ON processo_sanitario (criado_por_id);

-- ── Histórico de movimentações ───────────────────────────
-- Toda mudança efetiva de status gera uma linha, na mesma transação (D4).
-- O CHECK amarra cada tipo à transição da matriz D5; tipos sem mudança de
-- status têm anterior e novo nulos. nota_interna exige descrição (D37).

CREATE TABLE movimentacao_ocorrencia (
    id                uuid        NOT NULL DEFAULT gen_random_uuid(),
    ocorrencia_id     uuid        NOT NULL,
    usuario_id        uuid        NOT NULL,
    tipo_movimentacao varchar(30) NOT NULL,
    status_anterior   varchar(20),
    status_novo       varchar(20),
    data              timestamp   NOT NULL,
    descricao         text,
    criado_em         timestamp   NOT NULL DEFAULT now(),
    CONSTRAINT pk_movimentacao_ocorrencia PRIMARY KEY (id),
    CONSTRAINT fk_movimentacao_ocorrencia_ocorrencia FOREIGN KEY (ocorrencia_id) REFERENCES ocorrencia (id),
    CONSTRAINT fk_movimentacao_ocorrencia_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE RESTRICT,
    CONSTRAINT ck_movimentacao_ocorrencia_tipo CHECK (tipo_movimentacao IN (
        'REGISTRADA', 'EQUIPE_DESPACHADA', 'PROCESSO_VINCULADO',
        'AGUARDANDO_RESULTADO', 'ENCERRADA', 'NOTA_INTERNA'
    )),
    CONSTRAINT ck_movimentacao_ocorrencia_transicao CHECK (
        (tipo_movimentacao = 'REGISTRADA'
            AND status_anterior IS NULL AND status_novo = 'ABERTA')
        OR (tipo_movimentacao = 'EQUIPE_DESPACHADA'
            AND status_anterior = 'ABERTA' AND status_novo = 'EM_ATENDIMENTO')
        OR (tipo_movimentacao = 'ENCERRADA'
            AND status_anterior IN ('ABERTA', 'EM_ATENDIMENTO') AND status_novo = 'ENCERRADA')
        OR (tipo_movimentacao IN ('PROCESSO_VINCULADO', 'AGUARDANDO_RESULTADO', 'NOTA_INTERNA')
            AND status_anterior IS NULL AND status_novo IS NULL)
    ),
    CONSTRAINT ck_movimentacao_ocorrencia_nota_descricao CHECK (
        tipo_movimentacao <> 'NOTA_INTERNA' OR (descricao IS NOT NULL AND btrim(descricao) <> '')
    )
);

CREATE INDEX ix_movimentacao_ocorrencia_ocorrencia_id ON movimentacao_ocorrencia (ocorrencia_id);
CREATE INDEX ix_movimentacao_ocorrencia_usuario_id ON movimentacao_ocorrencia (usuario_id);

-- ── Anexos ───────────────────────────────────────────────
-- Metadados e conteúdo em tabelas separadas (D9): listagem e detalhe nunca
-- leem o bytea, que só é consultado no download. Limites espelham o front
-- (anexoOcorrencia.ts): JPG/PNG/PDF, até 5 MB; o máximo de 5 por ocorrência
-- é garantido no service com lock pessimista na ocorrência (D24).

CREATE TABLE anexo_ocorrencia (
    id            uuid         NOT NULL DEFAULT gen_random_uuid(),
    ocorrencia_id uuid         NOT NULL,
    nome          varchar(255) NOT NULL,
    mime_type     varchar(50)  NOT NULL,
    tamanho       integer      NOT NULL,
    criado_por_id uuid         NOT NULL,
    criado_em     timestamp    NOT NULL DEFAULT now(),
    CONSTRAINT pk_anexo_ocorrencia PRIMARY KEY (id),
    CONSTRAINT fk_anexo_ocorrencia_ocorrencia FOREIGN KEY (ocorrencia_id) REFERENCES ocorrencia (id),
    CONSTRAINT fk_anexo_ocorrencia_criado_por FOREIGN KEY (criado_por_id) REFERENCES usuario (id) ON DELETE RESTRICT,
    CONSTRAINT ck_anexo_ocorrencia_mime_type CHECK (mime_type IN ('image/jpeg', 'image/png', 'application/pdf')),
    CONSTRAINT ck_anexo_ocorrencia_tamanho CHECK (tamanho > 0 AND tamanho <= 5242880)
);

CREATE INDEX ix_anexo_ocorrencia_ocorrencia_id ON anexo_ocorrencia (ocorrencia_id);

CREATE TABLE anexo_ocorrencia_conteudo (
    anexo_id uuid  NOT NULL,
    conteudo bytea NOT NULL,
    CONSTRAINT pk_anexo_ocorrencia_conteudo PRIMARY KEY (anexo_id),
    CONSTRAINT fk_anexo_ocorrencia_conteudo_anexo FOREIGN KEY (anexo_id) REFERENCES anexo_ocorrencia (id)
);

-- ── Seed dos catálogos (DER §6 + D34) ────────────────────

INSERT INTO tipo_ocorrencia (codigo, nome) VALUES
    ('zoonose', 'Suspeita de Zoonose'),
    ('morcegos', 'Infestação de Morcegos'),
    ('irregular', 'Criação Irregular'),
    ('agressivo', 'Animal Agressivo'),
    ('outros', 'Outros')
ON CONFLICT (codigo) DO NOTHING;

-- `registro_indevido` não está no DER original: decisão D34 (registro
-- duplicado/indevido, permitido em ABERTA→ENCERRADA). O dashboard deve
-- excluí-la das contagens.
INSERT INTO providencia_tomada (codigo, nome) VALUES
    ('orientacao_municipe', 'Orientação ao munícipe'),
    ('encaminhamento_gepar', 'Encaminhamento ao GEPAR'),
    ('abertura_processo', 'Abertura de processo sanitário'),
    ('captura_remocao', 'Captura e remoção'),
    ('sem_acao', 'Sem ação necessária'),
    ('outro', 'Outro'),
    ('registro_indevido', 'Registro duplicado/indevido')
ON CONFLICT (codigo) DO NOTHING;

-- ── Permissão de sigilo (D6) ─────────────────────────────
-- Feature `denunciante_sigiloso`: vê os dados do denunciante em ocorrência
-- sigilosa. Concedida a Administrador e Agente Sanitário (UUIDs fixos da V3);
-- o Veterinário não recebe linha. Só leitura: a linha não concede escrita
-- nem exclusão no módulo (AutoridadeService trata feature ≠ 'geral' à parte).

INSERT INTO cargo_permissao (cargo_id, modulo, feature, leitura, escrita, exclusao) VALUES
    ('00000000-0000-4000-8000-000000000001', 'OCORRENCIAS_DENUNCIAS', 'denunciante_sigiloso', true, false, false),
    ('00000000-0000-4000-8000-000000000003', 'OCORRENCIAS_DENUNCIAS', 'denunciante_sigiloso', true, false, false)
ON CONFLICT (cargo_id, modulo, feature) DO NOTHING;
