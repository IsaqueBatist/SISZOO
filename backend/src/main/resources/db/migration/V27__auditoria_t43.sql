-- T43 — camada de auditoria de eventos (DER §3.8; docs/decisoes/T43.md)
--
-- 1. Ação ACESSO_NEGADO: acesso ao denunciante de ocorrência sigilosa
--    recusado pela regra de sigilo (download 403 ou detalhe mascarado). Recria
--    o CHECK da V12 com o novo valor, como a V12 fez com o da V2; o Flyway roda
--    a migration numa transação, então DROP e ADD são atômicos. 'ACESSO_NEGADO'
--    (13 caracteres) cabe em acao varchar(20).
--
-- 2. auditoria_evento passa a ser imutável no banco (pendência P7 de
--    docs/decisoes/auditoria-rn.md): DELETE, TRUNCATE e UPDATE são recusados
--    com check_violation (23514), para qualquer usuário e caminho, no padrão
--    da V17. Única exceção: a ação ON DELETE SET NULL de
--    fk_auditoria_evento_usuario (V2), que o DER documenta ("nulo se o usuário
--    for excluído"). O UPDATE só passa se TODAS as condições valerem:
--      - usuario_id passa de um valor para NULL;
--      - nenhuma outra coluna muda (comparação da linha inteira menos
--        usuario_id, que também cobre colunas criadas depois desta migration);
--      - o usuário referenciado já não existe (só acontece durante a exclusão
--        dele, que é quando a FK dispara o SET NULL);
--      - o UPDATE vem de dentro de outro trigger (a ação referencial roda como
--        trigger da FK; um UPDATE direto tem pg_trigger_depth() = 1).
--    Qualquer outra alteração, inclusive o SET NULL combinado com outra
--    coluna ou feito por SQL direto, é recusada.
--
-- A aplicação nunca altera nem exclui eventos (AuditoriaEventoService só
-- insere e lê), e a suíte de testes não limpa o banco com DELETE/TRUNCATE;
-- os ITs de migração usam schemas próprios removidos com DROP SCHEMA ...
-- CASCADE, que não dispara estes triggers.
--
-- Convenções herdadas de V13–V17: funções de trigger com SET search_path FROM
-- CURRENT (T29-7) e erro com CONSTRAINT nomeada.

ALTER TABLE auditoria_evento DROP CONSTRAINT ck_auditoria_evento_acao;
ALTER TABLE auditoria_evento ADD CONSTRAINT ck_auditoria_evento_acao CHECK (acao IN (
    'CRIACAO', 'ATUALIZACAO', 'DESATIVACAO', 'REATIVACAO', 'LOGIN', 'LOGOUT', 'EXPORTACAO', 'ENCERRAMENTO',
    'VISUALIZACAO', 'ACESSO_NEGADO'
));

CREATE FUNCTION fn_auditoria_evento_imutavel() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path FROM CURRENT
    AS $$
BEGIN
    IF TG_OP = 'UPDATE'
            AND OLD.usuario_id IS NOT NULL
            AND NEW.usuario_id IS NULL
            AND to_jsonb(NEW) - 'usuario_id' = to_jsonb(OLD) - 'usuario_id'
            AND pg_trigger_depth() > 1
            AND NOT EXISTS (SELECT 1 FROM usuario WHERE id = OLD.usuario_id) THEN
        RETURN NEW;
    END IF;
    RAISE EXCEPTION 'O evento de auditoria % não pode ser alterado nem excluído', OLD.id
        USING ERRCODE = 'check_violation', CONSTRAINT = 'ck_auditoria_evento_imutavel';
END
$$;

-- No nível de comando não há OLD: função própria para TRUNCATE.
CREATE FUNCTION fn_auditoria_evento_sem_truncate() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path FROM CURRENT
    AS $$
BEGIN
    RAISE EXCEPTION 'Os eventos de auditoria não podem ser excluídos'
        USING ERRCODE = 'check_violation', CONSTRAINT = 'ck_auditoria_evento_imutavel';
END
$$;

CREATE TRIGGER tg_auditoria_evento_imutavel
    BEFORE UPDATE OR DELETE ON auditoria_evento
    FOR EACH ROW EXECUTE FUNCTION fn_auditoria_evento_imutavel();

CREATE TRIGGER tg_auditoria_evento_sem_truncate
    BEFORE TRUNCATE ON auditoria_evento
    FOR EACH STATEMENT EXECUTE FUNCTION fn_auditoria_evento_sem_truncate();
