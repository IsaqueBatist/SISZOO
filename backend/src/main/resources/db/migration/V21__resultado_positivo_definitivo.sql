-- T35 — Positivo definitivo e registro do envio da notificação (issue #37;
-- docs/DER.md §3.5, docs/decisoes/T35.md T35-15 e T35-16)
--
-- 1. processo_sanitario.data_notificacao_municipe: data/hora em que o servidor
--    SMTP aceitou o e-mail de resultado positivo ao munícipe, gravada pela
--    aplicação depois do commit do resultado (relógio do projeto,
--    America/Sao_Paulo, sem fuso como as demais datas). Nula sem positivo,
--    sem e-mail cadastrado ou com falha de envio. Não prova entrega.
-- 2. Um resultado positivo não pode ser corrigido: o trigger recusa a
--    inserção de uma correção (retifica_id) de um registro positivo, para
--    qualquer usuário ou caminho, inclusive SQL manual (mesmo princípio da
--    DH-7). Com a imutabilidade da V14 (UPDATE/DELETE) e da V15 (TRUNCATE),
--    não sobra caminho para trocar um positivo registrado. O service recusa
--    antes (422); o trigger é a última barreira.
--
-- Linhas existentes não mudam: a coluna nasce nula, e uma correção de
-- positivo já gravada antes desta migration continua no histórico.
--
-- Convenções herdadas de V13–V15: função de trigger com
-- SET search_path FROM CURRENT (T29-7); ERRCODE e CONSTRAINT nomeados.

ALTER TABLE processo_sanitario ADD COLUMN data_notificacao_municipe timestamp;

COMMENT ON COLUMN processo_sanitario.data_notificacao_municipe IS
    'Data/hora (America/Sao_Paulo) em que o SMTP aceitou o e-mail de resultado positivo ao municipe (T35, #37); nula = nao enviado';

CREATE FUNCTION fn_resultado_positivo_definitivo() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path FROM CURRENT
    AS $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM resultado_processo r
        JOIN resultado_laboratorial l ON l.id = r.resultado_laboratorial_id
        WHERE r.id = NEW.retifica_id
          AND l.codigo = 'positivo'
    ) THEN
        RAISE EXCEPTION 'O resultado positivo % do processo sanitário % é definitivo e não pode ser corrigido',
                NEW.retifica_id, NEW.processo_id
            USING ERRCODE = 'check_violation', CONSTRAINT = 'ck_resultado_positivo_definitivo';
    END IF;
    RETURN NEW;
END
$$;

CREATE TRIGGER tg_resultado_positivo_definitivo
    BEFORE INSERT ON resultado_processo
    FOR EACH ROW
    WHEN (NEW.retifica_id IS NOT NULL)
    EXECUTE FUNCTION fn_resultado_positivo_definitivo();
