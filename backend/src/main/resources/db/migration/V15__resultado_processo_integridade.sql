-- T34 (follow-up) — Integridade do resultado do processo sanitário
-- (docs/decisoes/T34.md e docs/DER.md §3.5)
--
-- A V14 já foi aplicada; os ajustes vêm aqui, sem editá-la.
--
-- Convenções herdadas de V6–V14:
--   - funções de trigger com SET search_path FROM CURRENT (T29-7);
--   - erros do banco com ERRCODE e CONSTRAINT nomeados, como na V14.

-- ── Reconciliação do legado (PATCH provisório da D18) ─────
-- Antes da T34, o PATCH levava AGUARDANDO_RESULTADO a COM_RESULTADO sem
-- resultado. Esses processos ficam sem saída depois da V14 (o lançamento
-- responde 409 e não há vigente para corrigir); voltam a AGUARDANDO_RESULTADO
-- para receber o primeiro resultado.
--   - Sem evento em auditoria_evento: desvio aceito por não haver dados
--     reais (DH-3); ver docs/decisoes/T34.md.
--   - Não trata, de propósito, COM_RESULTADO com histórico e vigente nulo
--     (estado que a API não produz) nem CONCLUIDO sem resultado (terminal;
--     limitação conhecida).

UPDATE processo_sanitario
   SET status_processo = 'AGUARDANDO_RESULTADO',
       atualizado_em   = now()
 WHERE status_processo = 'COM_RESULTADO'
   AND resultado_laboratorial_id IS NULL
   AND NOT EXISTS (SELECT 1 FROM resultado_processo r WHERE r.processo_id = processo_sanitario.id);

-- ── Índice por processo ──────────────────────────────────
-- O histórico é lido por processo_id em todo detalhe e lançamento; os
-- índices da V14 não servem a essa busca (uq_resultado_processo_id_processo
-- começa por id; uq_resultado_processo_original é parcial).

CREATE INDEX ix_resultado_processo_processo_id ON resultado_processo (processo_id);

-- ── Uma linha não corrige a si mesma ─────────────────────
-- A FK composta auto-referente da V14 enxerga a própria linha no INSERT:
-- sem este CHECK, retifica_id = id passaria e criaria um ramo fora da cadeia.

ALTER TABLE resultado_processo
    ADD CONSTRAINT ck_resultado_processo_retifica_outro CHECK (retifica_id IS NULL OR retifica_id <> id);

-- ── Imutabilidade também contra TRUNCATE ─────────────────
-- O trigger da V14 é por linha (UPDATE e DELETE); TRUNCATE não dispara
-- triggers de linha. Função própria: no nível de comando não há OLD.

CREATE FUNCTION fn_resultado_processo_sem_truncate() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path FROM CURRENT
    AS $$
BEGIN
    RAISE EXCEPTION 'O histórico de resultados do processo sanitário é imutável'
        USING ERRCODE = 'check_violation', CONSTRAINT = 'ck_resultado_processo_imutavel';
END
$$;

CREATE TRIGGER tg_resultado_processo_sem_truncate
    BEFORE TRUNCATE ON resultado_processo
    FOR EACH STATEMENT EXECUTE FUNCTION fn_resultado_processo_sem_truncate();
