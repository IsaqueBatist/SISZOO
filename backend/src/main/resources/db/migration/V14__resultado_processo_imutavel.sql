-- T37 — Lançamento de resultado do processo sanitário (docs/decisoes/T37.md)
--
-- Resolve a pendência R1 da T29: "sem resultado ainda" é representado só por
-- resultado_laboratorial_id IS NULL (o catálogo "aguardando" segue existindo
-- no seed, mas o service recusa gravá-lo como resultado escolhido).
--
-- Resultado, data do resultado e desfecho do animal são gravados numa única
-- vez, pelo mesmo lançamento (POST /api/processos/{id}/resultado). Registro
-- clínico imutável (CLAUDE.md raiz: "nunca UPDATE/DELETE"): uma vez que
-- resultado_laboratorial_id é definido, qualquer tentativa de mudar esses
-- três campos é recusada pelo banco — mesmo molde do trigger de vínculo com
-- ocorrência da V13 (fn_processo_sanitario_vinculo_imutavel), sem exceção
-- para nenhum caminho, inclusive SQL manual.

CREATE FUNCTION fn_processo_sanitario_resultado_imutavel() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path FROM CURRENT
    AS $$
BEGIN
    RAISE EXCEPTION 'O resultado do processo sanitario % e imutavel', OLD.id
        USING ERRCODE = 'check_violation', CONSTRAINT = 'ck_processo_sanitario_resultado_imutavel';
END
$$;

CREATE TRIGGER tg_processo_sanitario_resultado_imutavel
    BEFORE UPDATE OF resultado_laboratorial_id, data_resultado, desfecho_animal_id ON processo_sanitario
    FOR EACH ROW
    WHEN (OLD.resultado_laboratorial_id IS NOT NULL AND (
        NEW.resultado_laboratorial_id IS DISTINCT FROM OLD.resultado_laboratorial_id OR
        NEW.data_resultado IS DISTINCT FROM OLD.data_resultado OR
        NEW.desfecho_animal_id IS DISTINCT FROM OLD.desfecho_animal_id
    ))
    EXECUTE FUNCTION fn_processo_sanitario_resultado_imutavel();
