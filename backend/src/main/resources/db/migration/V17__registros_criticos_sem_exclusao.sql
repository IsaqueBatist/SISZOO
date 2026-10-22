-- Registros críticos não podem ser excluídos (RN06; docs/decisoes/auditoria-rn.md)
--
-- Histórico veterinário (vacinação, procedimento, prescrição) e processo
-- sanitário não têm exclusão na aplicação (sem DELETE na API, nos services e
-- nos repositories), mas o banco aceitava DELETE e TRUNCATE por SQL direto. A
-- partir daqui, o banco recusa os dois, para qualquer usuário e caminho, como
-- já faz com resultado_processo (V14).
--
-- Só exclusão: UPDATE continua permitido. O processo muda de status e de
-- resultado vigente; os registros clínicos não têm caminho de UPDATE na
-- aplicação, mas bloqueá-lo no banco fica fora deste escopo.
--
-- Convenções herdadas de V13–V14:
--   - funções de trigger com SET search_path FROM CURRENT (T29-7);
--   - erro check_violation (23514) com CONSTRAINT nomeada, como na V14.
--
-- Nenhuma FK com ON DELETE CASCADE parte destas tabelas nem chega a elas
-- (V6, V7, V10, V13, V14): apagar animal, usuário ou ocorrência referenciados
-- já falhava por FK. TRUNCATE ... CASCADE de uma tabela-pai alcança estas e
-- também é recusado, porque o trigger de TRUNCATE dispara em toda tabela
-- truncada.

CREATE FUNCTION fn_registro_critico_sem_exclusao() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path FROM CURRENT
    AS $$
BEGIN
    RAISE EXCEPTION 'O registro % de % não pode ser excluído (RN06)', OLD.id, TG_TABLE_NAME
        USING ERRCODE = 'check_violation', CONSTRAINT = 'ck_' || TG_TABLE_NAME || '_sem_exclusao';
END
$$;

-- No nível de comando não há OLD: função própria para TRUNCATE.
CREATE FUNCTION fn_registro_critico_sem_truncate() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path FROM CURRENT
    AS $$
BEGIN
    RAISE EXCEPTION 'Os registros de % não podem ser excluídos (RN06)', TG_TABLE_NAME
        USING ERRCODE = 'check_violation', CONSTRAINT = 'ck_' || TG_TABLE_NAME || '_sem_exclusao';
END
$$;

-- ── Histórico veterinário ────────────────────────────────

CREATE TRIGGER tg_vacinacao_sem_exclusao
    BEFORE DELETE ON vacinacao
    FOR EACH ROW EXECUTE FUNCTION fn_registro_critico_sem_exclusao();

CREATE TRIGGER tg_vacinacao_sem_truncate
    BEFORE TRUNCATE ON vacinacao
    FOR EACH STATEMENT EXECUTE FUNCTION fn_registro_critico_sem_truncate();

CREATE TRIGGER tg_procedimento_sem_exclusao
    BEFORE DELETE ON procedimento
    FOR EACH ROW EXECUTE FUNCTION fn_registro_critico_sem_exclusao();

CREATE TRIGGER tg_procedimento_sem_truncate
    BEFORE TRUNCATE ON procedimento
    FOR EACH STATEMENT EXECUTE FUNCTION fn_registro_critico_sem_truncate();

CREATE TRIGGER tg_prescricao_sem_exclusao
    BEFORE DELETE ON prescricao
    FOR EACH ROW EXECUTE FUNCTION fn_registro_critico_sem_exclusao();

CREATE TRIGGER tg_prescricao_sem_truncate
    BEFORE TRUNCATE ON prescricao
    FOR EACH STATEMENT EXECUTE FUNCTION fn_registro_critico_sem_truncate();

-- ── Processo sanitário ───────────────────────────────────
-- Antes, apagar amostras, responsável e processo na mesma transação passava
-- (os triggers adiáveis da V13 não cobram um processo removido). Agora o
-- DELETE do processo desfaz a transação inteira. Remover uma amostra que não
-- seja a última continua possível (V13).

CREATE TRIGGER tg_processo_sanitario_sem_exclusao
    BEFORE DELETE ON processo_sanitario
    FOR EACH ROW EXECUTE FUNCTION fn_registro_critico_sem_exclusao();

CREATE TRIGGER tg_processo_sanitario_sem_truncate
    BEFORE TRUNCATE ON processo_sanitario
    FOR EACH STATEMENT EXECUTE FUNCTION fn_registro_critico_sem_truncate();
