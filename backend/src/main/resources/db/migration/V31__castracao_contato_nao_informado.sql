-- Castração e contato humano sem resposta obrigatória (decisão funcional de 31/10/2026)
--
-- As duas colunas passam a ter três estados: true (sim), false (não) e NULL
-- (não informado). Nenhum registro existente muda: os `false` antigos continuam
-- `false`, porque não dá para distinguir uma resposta "não" do valor padrão que
-- a tela e a coluna preenchiam sozinhas.
--
-- animal.esterilizado perde também o DEFAULT false: um INSERT que omita a coluna
-- não pode transformar ausência de resposta em "não".

ALTER TABLE animal ALTER COLUMN esterilizado DROP DEFAULT;
ALTER TABLE animal ALTER COLUMN esterilizado DROP NOT NULL;

ALTER TABLE animal_amostrado ALTER COLUMN contato_humano DROP NOT NULL;

-- Nível de contato e agressão existem se, e somente se, houve contato. Com NULL,
-- a expressão antiga daria NULL e o CHECK deixaria passar qualquer combinação.
ALTER TABLE animal_amostrado DROP CONSTRAINT ck_animal_amostrado_contato;
ALTER TABLE animal_amostrado ADD CONSTRAINT ck_animal_amostrado_contato CHECK (
    (contato_humano IS TRUE AND nivel_contato IS NOT NULL AND agrediu_humano IS NOT NULL)
    OR
    (contato_humano IS NOT TRUE AND nivel_contato IS NULL AND agrediu_humano IS NULL)
);
