-- Sessão com renovação deslizante (docs/decisoes/sessao.md)
--
-- A V8 removeu a tabela `sessao` da V2 porque nada a usava. A decisão funcional
-- de 31/10/2026 pede renovação enquanto há uso, expiração por 60 minutos de
-- inatividade, logout e invalidação de verdade, o que exige estado no servidor.
-- Tabela nova, com outro nome e outro contrato: guarda só o hash SHA-256 do
-- token de renovação (cookie httpOnly), nunca o token.
--
-- token_anterior_hash: o token substituído na última rotação. É aceito por
-- pouco tempo (renovações simultâneas); depois disso, apresentá-lo é reuso e
-- encerra a sessão.
--
-- motivo_encerramento fica sem CHECK de propósito: é informativo, gravado só
-- pelo enum MotivoEncerramentoSessao, e nenhuma regra depende do valor.

CREATE TABLE sessao_usuario (
    id                  uuid         NOT NULL DEFAULT gen_random_uuid(),
    usuario_id          uuid         NOT NULL,
    token_hash          varchar(64)  NOT NULL,
    token_anterior_hash varchar(64),
    rotacionado_em      timestamp    NOT NULL,
    criada_em           timestamp    NOT NULL,
    ultima_atividade_em timestamp    NOT NULL,
    encerrada_em        timestamp,
    motivo_encerramento varchar(30),
    ip                  varchar(45),
    user_agent          varchar(255),
    CONSTRAINT pk_sessao_usuario PRIMARY KEY (id),
    CONSTRAINT uq_sessao_usuario_token_hash UNIQUE (token_hash),
    CONSTRAINT fk_sessao_usuario_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE
);

CREATE INDEX ix_sessao_usuario_token_anterior_hash ON sessao_usuario (token_anterior_hash);
CREATE INDEX ix_sessao_usuario_ativas ON sessao_usuario (usuario_id) WHERE encerrada_em IS NULL;

-- SESSAO_REVOGADA (15 caracteres) cabe em acao varchar(20). Mesmo padrão da
-- V12 e da V27 para ampliar o CHECK.
ALTER TABLE auditoria_evento DROP CONSTRAINT ck_auditoria_evento_acao;
ALTER TABLE auditoria_evento ADD CONSTRAINT ck_auditoria_evento_acao CHECK (acao IN (
    'CRIACAO', 'ATUALIZACAO', 'DESATIVACAO', 'REATIVACAO', 'LOGIN', 'LOGOUT', 'EXPORTACAO', 'ENCERRAMENTO',
    'VISUALIZACAO', 'ACESSO_NEGADO', 'SESSAO_REVOGADA'
));
