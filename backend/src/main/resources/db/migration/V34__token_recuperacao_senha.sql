-- Recuperação de senha pela tela de login ("Esqueci minha senha")
--
-- O usuário informa o e-mail institucional e recebe um link com um token de uso
-- único. Como na sessao_usuario (V29), o banco guarda só o hash SHA-256 do
-- token: o valor em si vai apenas no link do e-mail.
--
-- Ciclo de vida de uma linha: criada na solicitação (expira_em = criado_em +
-- validade); usado_em preenchido quando a senha é redefinida; invalidado_em
-- preenchido quando o usuário pede um novo link antes de usar o anterior ou
-- quando a senha muda por outro caminho. Um token só vale com os dois campos
-- nulos e expira_em no futuro (RecuperacaoSenhaService).
--
-- Aditiva: nenhuma tabela existente muda.

CREATE TABLE token_recuperacao_senha (
    id             uuid         NOT NULL DEFAULT gen_random_uuid(),
    usuario_id     uuid         NOT NULL,
    token_hash     varchar(64)  NOT NULL,
    criado_em      timestamp    NOT NULL,
    expira_em      timestamp    NOT NULL,
    usado_em       timestamp,
    invalidado_em  timestamp,
    ip_solicitacao varchar(45),
    CONSTRAINT pk_token_recuperacao_senha PRIMARY KEY (id),
    CONSTRAINT uq_token_recuperacao_senha_token_hash UNIQUE (token_hash),
    CONSTRAINT fk_token_recuperacao_senha_usuario FOREIGN KEY (usuario_id) REFERENCES usuario (id) ON DELETE CASCADE
);

-- Tokens ainda pendentes de um usuário: invalidados em bloco a cada nova
-- solicitação e a cada troca de senha.
CREATE INDEX ix_token_recuperacao_senha_pendentes ON token_recuperacao_senha (usuario_id)
    WHERE usado_em IS NULL AND invalidado_em IS NULL;

-- Expurgo dos vencidos (RecuperacaoSenhaService.expurgarVencidos).
CREATE INDEX ix_token_recuperacao_senha_expira_em ON token_recuperacao_senha (expira_em);
