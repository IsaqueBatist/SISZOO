-- T24 — Regras do registro clínico (docs/regras-negocio-clinico.md)
--
-- RN-C05: dose_unidade passa a ser obrigatória em vacinação (simetria com
-- prescricao.dose_unidade, já NOT NULL em V6).
--
-- Não-destrutiva para dados legados: o formulário anterior à T24 permitia
-- salvar vacinação sem unidade, e não existe fonte confiável para deduzir a
-- unidade desses registros (o catálogo `vacina` não tem unidade). Gravar um
-- palpite num dado clínico está fora de questão, então:
--   - nenhum UPDATE/backfill: as linhas legadas continuam com dose_unidade
--     nulo e a API as devolve como "não informada";
--   - em vez de SET NOT NULL (que abortaria com legados), um CHECK NOT VALID:
--     o PostgreSQL passa a exigir a unidade em toda linha nova, sem validar
--     as já existentes;
--   - a unidade de um registro legado é informada por retificação (RN-C02):
--     o novo registro passa pelo CHECK e pelo @NotNull da API.
-- DROP ... IF EXISTS deixa o passo reexecutável sem erro.
ALTER TABLE vacinacao DROP CONSTRAINT IF EXISTS ck_vacinacao_dose_unidade_obrigatoria;
ALTER TABLE vacinacao ADD CONSTRAINT ck_vacinacao_dose_unidade_obrigatoria
    CHECK (dose_unidade IS NOT NULL) NOT VALID;

-- RN-C04: o autor de registro clínico não pode ser removido fisicamente
-- enquanto referenciado. Substitui o ON DELETE SET NULL de V6, que apagaria
-- silenciosamente a autoria de um registro imutável.
ALTER TABLE vacinacao DROP CONSTRAINT fk_vacinacao_usuario;
ALTER TABLE vacinacao ADD CONSTRAINT fk_vacinacao_usuario
    FOREIGN KEY (aplicado_por_id) REFERENCES usuario (id) ON DELETE RESTRICT;

ALTER TABLE procedimento DROP CONSTRAINT fk_procedimento_usuario;
ALTER TABLE procedimento ADD CONSTRAINT fk_procedimento_usuario
    FOREIGN KEY (executado_por_id) REFERENCES usuario (id) ON DELETE RESTRICT;

ALTER TABLE prescricao DROP CONSTRAINT fk_prescricao_usuario;
ALTER TABLE prescricao ADD CONSTRAINT fk_prescricao_usuario
    FOREIGN KEY (prescrito_por_id) REFERENCES usuario (id) ON DELETE RESTRICT;
