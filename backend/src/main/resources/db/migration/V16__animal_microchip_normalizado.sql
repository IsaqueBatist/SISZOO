-- Microchip normalizado e único quando presente (RN01, RN07, RF-A01;
-- docs/decisoes/auditoria-rn.md)
--
-- O microchip é opcional no cadastro, mas identifica o animal de forma única
-- quando informado. Até aqui o servidor gravava o texto como recebido: "985" e
-- " 9 85 " eram microchips diferentes para o UNIQUE da V4. A aplicação passa a
-- normalizar (AnimalService.normalizarMicrochip): sem espaços, nas pontas e no
-- meio; vazio vira NULL. Esta migration aplica a mesma regra aos dados
-- existentes.
--
-- Convenções herdadas de V4–V14:
--   - V4–V14 não são editadas;
--   - erros do banco com mensagem e HINT claros, como a pré-condição da V13.

-- ── Pré-condição: nenhuma duplicata depois da normalização ─
-- Duas fichas com o mesmo microchip normalizado são o mesmo animal físico ou
-- erro de digitação: só o CCZ sabe qual é a correta. A migration não escolhe;
-- para e lista os conflitos.

DO $$
DECLARE
    conflitos text;
BEGIN
    SELECT string_agg(format('%s (animais %s)', normalizado, animais), '; ')
      INTO conflitos
      FROM (SELECT regexp_replace(microchip, '\s', '', 'g') AS normalizado,
                   string_agg(id::text, ', ' ORDER BY criado_em, id) AS animais
              FROM animal
             WHERE microchip IS NOT NULL AND regexp_replace(microchip, '\s', '', 'g') <> ''
             GROUP BY 1
            HAVING count(*) > 1) AS duplicados;
    IF conflitos IS NOT NULL THEN
        RAISE EXCEPTION 'V16: microchips duplicados depois da normalização (sem espaços): %', conflitos
            USING HINT = 'Corrija as fichas no banco (mantenha o microchip em uma só) e rode as migrations de novo. A V16 não resolve duplicatas sozinha.';
    END IF;
END
$$;

-- ── Troca do UNIQUE da V4 por índice único parcial ───────
-- A V4 criou `CONSTRAINT uq_animal_microchip UNIQUE (microchip)` (constraint
-- de tabela, com índice de mesmo nome). Ela já aceitava vários NULL; o índice
-- parcial deixa explícito "único quando presente" e mantém o nome, que aparece
-- na mensagem de violação (23505) que a aplicação recebe.

ALTER TABLE animal DROP CONSTRAINT uq_animal_microchip;

UPDATE animal
   SET microchip = NULLIF(regexp_replace(microchip, '\s', '', 'g'), '')
 WHERE microchip IS DISTINCT FROM NULLIF(regexp_replace(microchip, '\s', '', 'g'), '');

CREATE UNIQUE INDEX uq_animal_microchip ON animal (microchip) WHERE microchip IS NOT NULL;
