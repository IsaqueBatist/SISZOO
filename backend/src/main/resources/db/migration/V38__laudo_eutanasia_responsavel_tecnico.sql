ALTER TABLE animal
    ADD COLUMN laudo_eutanasia_responsavel_id uuid,
    ADD COLUMN laudo_eutanasia_crmv varchar(20),
    ADD COLUMN laudo_eutanasia_metodo varchar(120),
    ADD COLUMN laudo_eutanasia_insensibilizacao_previa boolean,
    ADD COLUMN laudo_eutanasia_registrado_em timestamp;

ALTER TABLE animal
    ADD CONSTRAINT fk_animal_laudo_eutanasia_responsavel
        FOREIGN KEY (laudo_eutanasia_responsavel_id) REFERENCES usuario (id) ON DELETE RESTRICT;

ALTER TABLE animal
    ADD CONSTRAINT ck_animal_laudo_eutanasia_completo CHECK (
        (laudo_eutanasia_responsavel_id IS NULL AND laudo_eutanasia_crmv IS NULL AND laudo_eutanasia_metodo IS NULL
            AND laudo_eutanasia_insensibilizacao_previa IS NULL AND laudo_eutanasia_registrado_em IS NULL)
        OR (laudo_eutanasia_responsavel_id IS NOT NULL AND laudo_eutanasia_crmv IS NOT NULL
            AND laudo_eutanasia_metodo IS NOT NULL AND laudo_eutanasia_insensibilizacao_previa
            AND laudo_eutanasia_registrado_em IS NOT NULL AND laudo_eutanasia IS NOT NULL));

INSERT INTO cargo_permissao (cargo_id, modulo, feature, leitura, escrita, exclusao) VALUES
    ('00000000-0000-4000-8000-000000000002', 'GESTAO_ANIMAIS', 'eutanasia', false, true, false)
ON CONFLICT (cargo_id, modulo, feature) DO NOTHING;

COMMENT ON COLUMN animal.laudo_eutanasia_responsavel_id IS 'Veterinário que registrou o laudo de eutanásia (Lei nº 14.228/2021, art. 2º, § 1º)';
COMMENT ON COLUMN animal.laudo_eutanasia_crmv IS 'CRMV do responsável técnico copiado no momento do registro';
COMMENT ON COLUMN animal.laudo_eutanasia_metodo IS 'Método de eutanásia informado pelo responsável técnico';
COMMENT ON COLUMN animal.laudo_eutanasia_insensibilizacao_previa IS 'Insensibilização prévia (Lei estadual nº 11.977/2005, art. 12, parágrafo único); só true é aceito';
COMMENT ON COLUMN animal.laudo_eutanasia_registrado_em IS 'Data e hora do registro do laudo pelo responsável técnico';
