-- Módulo 1 — Usuários & Acesso (docs/modulo1-usuarios-acesso.dbml)

-- ── Usuario ────────────────────────────────────────────

CREATE TABLE usuario (
    id                  uuid         NOT NULL DEFAULT gen_random_uuid(),
    email               varchar(255) NOT NULL,
    senha               varchar(255) NOT NULL,
    nome                varchar(100) NOT NULL,
    sobrenome           varchar(100) NOT NULL,
    crmv                varchar(20),
    telefone            varchar(20),
    ativo               boolean      NOT NULL DEFAULT true,
    dois_fatores_ativo  boolean      NOT NULL DEFAULT false,
    ultimo_acesso       timestamp,
    criado_em           timestamp    NOT NULL DEFAULT now(),
    senha_alterada_em   timestamp,
    desativado_em       timestamp,
    data_modificacao    timestamp    NOT NULL DEFAULT now(),
    CONSTRAINT pk_usuario PRIMARY KEY (id),
    CONSTRAINT uq_usuario_email UNIQUE (email)
);

-- ── Sessao ─────────────────────────────────────────────

CREATE TABLE sessao (
    id           uuid         NOT NULL DEFAULT gen_random_uuid(),
    usuario_id   uuid         NOT NULL,
    token_hash   varchar(512) NOT NULL,
    ip           varchar(45),
    user_agent   text,
    criada_em    timestamp    NOT NULL DEFAULT now(),
    expira_em    timestamp    NOT NULL,
    encerrada_em timestamp,
    CONSTRAINT pk_sessao PRIMARY KEY (id),
    CONSTRAINT uq_sessao_token_hash UNIQUE (token_hash),
    CONSTRAINT fk_sessao_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE
);

CREATE INDEX ix_sessao_usuario_id ON sessao (usuario_id);

-- ── Cargo e Permissões ──────────────────────────────────

CREATE TABLE cargo (
    id        uuid         NOT NULL DEFAULT gen_random_uuid(),
    nome      varchar(100) NOT NULL,
    descricao text,
    CONSTRAINT pk_cargo PRIMARY KEY (id)
);

CREATE TABLE usuario_cargo (
    usuario_id    uuid      NOT NULL,
    cargo_id      uuid      NOT NULL,
    adicionado_em timestamp NOT NULL DEFAULT now(),
    CONSTRAINT pk_usuario_cargo PRIMARY KEY (usuario_id, cargo_id),
    CONSTRAINT fk_usuario_cargo_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE,
    CONSTRAINT fk_usuario_cargo_cargo FOREIGN KEY (cargo_id) REFERENCES cargo (id) ON DELETE CASCADE
);

CREATE TABLE cargo_permissao (
    id       uuid         NOT NULL DEFAULT gen_random_uuid(),
    cargo_id uuid         NOT NULL,
    modulo   varchar(30)  NOT NULL,
    feature  varchar(100) NOT NULL,
    leitura  boolean      NOT NULL DEFAULT false,
    escrita  boolean      NOT NULL DEFAULT false,
    exclusao boolean      NOT NULL DEFAULT false,
    CONSTRAINT pk_cargo_permissao PRIMARY KEY (id),
    CONSTRAINT uq_cargo_permissao UNIQUE (cargo_id, modulo, feature),
    CONSTRAINT fk_cargo_permissao_cargo FOREIGN KEY (cargo_id) REFERENCES cargo (id) ON DELETE CASCADE,
    CONSTRAINT ck_cargo_permissao_modulo CHECK (modulo IN (
        'USUARIOS_ACESSO', 'GESTAO_ANIMAIS', 'OCORRENCIAS_DENUNCIAS', 'PROCESSOS_SANITARIOS', 'RELATORIOS'
    ))
);

-- ── Preferências ────────────────────────────────────────

CREATE TABLE preferencia_usuario (
    id                     uuid        NOT NULL DEFAULT gen_random_uuid(),
    usuario_id             uuid        NOT NULL,
    tema                   varchar(10) NOT NULL DEFAULT 'LIGHT',
    densidade              varchar(15) NOT NULL DEFAULT 'NORMAL',
    notif_alertas_criticos boolean     NOT NULL DEFAULT true,
    notif_vacina_vencendo  boolean     NOT NULL DEFAULT true,
    notif_superlotacao     boolean     NOT NULL DEFAULT true,
    notif_resultado_lab    boolean     NOT NULL DEFAULT true,
    notif_email_diario     boolean     NOT NULL DEFAULT false,
    CONSTRAINT pk_preferencia_usuario PRIMARY KEY (id),
    CONSTRAINT uq_preferencia_usuario_usuario_id UNIQUE (usuario_id),
    CONSTRAINT fk_preferencia_usuario_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE,
    CONSTRAINT ck_preferencia_usuario_tema CHECK (tema IN ('LIGHT', 'DARK')),
    CONSTRAINT ck_preferencia_usuario_densidade CHECK (densidade IN ('COMPACTO', 'NORMAL', 'CONFORTAVEL'))
);

-- ── Auditoria ───────────────────────────────────────────

CREATE TABLE auditoria_evento (
    id             uuid         NOT NULL DEFAULT gen_random_uuid(),
    usuario_id     uuid,
    acao           varchar(20)  NOT NULL,
    entidade       varchar(100) NOT NULL,
    payload_antes  jsonb,
    payload_depois jsonb,
    ip             varchar(45),
    ocorreu_em     timestamp    NOT NULL DEFAULT now(),
    CONSTRAINT pk_auditoria_evento PRIMARY KEY (id),
    CONSTRAINT fk_auditoria_evento_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE SET NULL,
    CONSTRAINT ck_auditoria_evento_acao CHECK (acao IN (
        'CRIACAO', 'ATUALIZACAO', 'DESATIVACAO', 'REATIVACAO', 'LOGIN', 'LOGOUT', 'EXPORTACAO', 'ENCERRAMENTO'
    ))
);

CREATE INDEX ix_auditoria_evento_usuario_id ON auditoria_evento (usuario_id);
CREATE INDEX ix_auditoria_evento_entidade ON auditoria_evento (entidade);
CREATE INDEX ix_auditoria_evento_ocorreu_em ON auditoria_evento (ocorreu_em);
