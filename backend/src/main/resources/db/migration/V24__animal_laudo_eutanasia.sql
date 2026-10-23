-- F2-008 (Fase 3 do TG, 22/10/2026) — Laudo de eutanásia (RF-A05 / Lei nº
-- 14.228/2021, art. 2º, § 1º): justificativa do responsável técnico registrada
-- quando o destino do animal é óbito por eutanásia (status obito_eutanasia).
--
-- A obrigatoriedade vale SOMENTE na transição para obito_eutanasia e é
-- aplicada no AnimalService (criação já em eutanásia ou edição que muda o
-- status para eutanásia). Sem CHECK no banco, de propósito: registros
-- existentes com status obito_eutanasia e sem laudo continuam válidos e
-- editáveis — a regra não invalida o histórico anterior a esta migration.
ALTER TABLE animal
    ADD COLUMN laudo_eutanasia text;

COMMENT ON COLUMN animal.laudo_eutanasia IS 'Laudo do responsável técnico que justifica a eutanásia (RF-A05); exigido pela aplicação na transição para obito_eutanasia';
