-- F2-004 (Fase 3 do TG, 22/10/2026) — Identificação complementar do animal
-- (RF-A01 / RN01 / Quadro 67 do TG): número da medalha, data de implantação do
-- microchip e procedência.
--
-- - numero_medalha: identificação física alternativa ao microchip (plaqueta).
--   Única quando informada, como o microchip (V16): índice único parcial.
--   Gravada normalizada pelo AnimalService (sem espaços; vazio = NULL).
-- - data_implantacao_chip: RN01 — "o número e a data de implantação são
--   registrados" quando o animal recebe o chip no CCZ. Só faz sentido com
--   microchip informado e nunca é futura (validado no AnimalService, com o
--   Clock do projeto; CHECK só para a coerência com o microchip).
-- - procedencia: origem/procedência do animal em texto livre (RF-A05 — "a
--   procedência ao entrar"), complementar ao catálogo motivo_entrada.
--
-- Todas opcionais: registros existentes continuam válidos (sem backfill).
ALTER TABLE animal
    ADD COLUMN numero_medalha varchar(30),
    ADD COLUMN data_implantacao_chip date,
    ADD COLUMN procedencia varchar(200);

CREATE UNIQUE INDEX uq_animal_numero_medalha ON animal (numero_medalha) WHERE numero_medalha IS NOT NULL;

ALTER TABLE animal
    ADD CONSTRAINT ck_animal_implantacao_exige_microchip
        CHECK (data_implantacao_chip IS NULL OR microchip IS NOT NULL);

COMMENT ON COLUMN animal.numero_medalha IS 'Número da medalha/plaqueta de identificação; único quando informado (F2-004, RF-A01)';
COMMENT ON COLUMN animal.data_implantacao_chip IS 'Data em que o microchip foi implantado (RN01); exige microchip informado';
COMMENT ON COLUMN animal.procedencia IS 'Procedência/origem do animal na entrada (RF-A05), texto livre';
