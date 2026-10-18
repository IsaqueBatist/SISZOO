-- T34 — Registro de resultado laboratorial do processo sanitário (docs/DER.md
-- §3.5 e §5 regra 19)
--
-- O resultado é registro crítico imutável: cada lançamento é uma linha nova de
-- resultado_processo, e a correção é outra linha com retifica_id apontando
-- para a corrigida, que fica preservada (mesmo mecanismo dos registros
-- clínicos, RN-C02/V6). processo_sanitario.resultado_laboratorial_id e
-- data_resultado (V13) guardam o resultado vigente, gravados pelo service na
-- mesma transação; o histórico completo é esta tabela.
--
-- Convenções herdadas de V6–V13:
--   - FK de autor com ON DELETE RESTRICT (V7); sem CASCADE;
--   - registrado_em com DEFAULT now(), preenchido pelo Hibernate (D39);
--     data_resultado é data de negócio, sem DEFAULT;
--   - funções de trigger com SET search_path FROM CURRENT (T29-7).

CREATE TABLE resultado_processo (
    id                        uuid      NOT NULL DEFAULT gen_random_uuid(),
    processo_id               uuid      NOT NULL,
    resultado_laboratorial_id uuid      NOT NULL,
    data_resultado            date      NOT NULL,
    observacoes               text,
    retifica_id               uuid,
    registrado_por_id         uuid      NOT NULL,
    registrado_em             timestamp NOT NULL DEFAULT now(),
    CONSTRAINT pk_resultado_processo PRIMARY KEY (id),
    -- Alvo da FK composta abaixo: (id, processo_id) já é único pela PK.
    CONSTRAINT uq_resultado_processo_id_processo UNIQUE (id, processo_id),
    CONSTRAINT fk_resultado_processo_processo FOREIGN KEY (processo_id) REFERENCES processo_sanitario (id),
    CONSTRAINT fk_resultado_processo_resultado_laboratorial
        FOREIGN KEY (resultado_laboratorial_id) REFERENCES resultado_laboratorial (id),
    CONSTRAINT fk_resultado_processo_registrado_por
        FOREIGN KEY (registrado_por_id) REFERENCES usuario (id) ON DELETE RESTRICT,
    -- A correção é sempre de um resultado do mesmo processo (MATCH SIMPLE:
    -- com retifica_id nulo, a FK não se aplica).
    CONSTRAINT fk_resultado_processo_retifica
        FOREIGN KEY (retifica_id, processo_id) REFERENCES resultado_processo (id, processo_id),
    -- Cada resultado é corrigido no máximo uma vez, mesmo sob concorrência.
    CONSTRAINT uq_resultado_processo_retifica_id UNIQUE (retifica_id)
);

-- Um único resultado original (sem retifica_id) por processo. Com o UNIQUE de
-- retifica_id, o histórico de cada processo é uma cadeia linear: o vigente é
-- a única linha que nenhuma outra corrige.
CREATE UNIQUE INDEX uq_resultado_processo_original ON resultado_processo (processo_id) WHERE retifica_id IS NULL;

CREATE INDEX ix_resultado_processo_resultado_laboratorial_id ON resultado_processo (resultado_laboratorial_id);
CREATE INDEX ix_resultado_processo_registrado_por_id ON resultado_processo (registrado_por_id);

-- ── Imutabilidade (registro crítico) ─────────────────────
-- Nenhuma linha é alterada nem removida, por qualquer caminho e qualquer
-- usuário, inclusive SQL manual (mesmo princípio do vínculo imutável, DH-7).
-- O service não tem caminho de mutação; o trigger é a última barreira.

CREATE FUNCTION fn_resultado_processo_imutavel() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path FROM CURRENT
    AS $$
BEGIN
    RAISE EXCEPTION 'O resultado % do processo sanitário % é imutável', OLD.id, OLD.processo_id
        USING ERRCODE = 'check_violation', CONSTRAINT = 'ck_resultado_processo_imutavel';
END
$$;

CREATE TRIGGER tg_resultado_processo_imutavel
    BEFORE UPDATE OR DELETE ON resultado_processo
    FOR EACH ROW EXECUTE FUNCTION fn_resultado_processo_imutavel();
