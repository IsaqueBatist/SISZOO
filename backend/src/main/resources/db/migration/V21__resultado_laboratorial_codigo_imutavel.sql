-- T35 — Código do catálogo resultado_laboratorial imutável (docs/DER.md §3.5,
-- docs/decisoes/T35.md T35-19)
--
-- As regras do processo sanitário se apoiam no código do resultado, não no id:
-- "positivo" notifica o munícipe e é definitivo (trigger da V20), "aguardando"
-- não é lançável. Renomear um código (ex.: positivo -> outro nome) mudaria o
-- sentido de registros já gravados e abriria um contorno para o trigger da
-- V20. Nenhuma API escreve nesse catálogo e o seed da V13 só insere; o
-- trigger fecha o caminho que sobra, o SQL direto, para qualquer usuário.
-- nome e ativo continuam alteráveis.
--
-- Convenções herdadas de V13–V20: função de trigger com
-- SET search_path FROM CURRENT (T29-7); ERRCODE e CONSTRAINT nomeados.

CREATE FUNCTION fn_resultado_laboratorial_codigo_imutavel() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path FROM CURRENT
    AS $$
BEGIN
    RAISE EXCEPTION 'O código % do catálogo de resultado laboratorial é imutável', OLD.codigo
        USING ERRCODE = 'check_violation', CONSTRAINT = 'ck_resultado_laboratorial_codigo_imutavel';
END
$$;

CREATE TRIGGER tg_resultado_laboratorial_codigo_imutavel
    BEFORE UPDATE OF codigo ON resultado_laboratorial
    FOR EACH ROW
    WHEN (NEW.codigo IS DISTINCT FROM OLD.codigo)
    EXECUTE FUNCTION fn_resultado_laboratorial_codigo_imutavel();
