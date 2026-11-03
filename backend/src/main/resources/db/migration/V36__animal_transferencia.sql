ALTER TABLE animal
    ADD COLUMN destino_transferencia varchar(200),
    ADD COLUMN tipo_destino_transferencia varchar(40),
    ADD COLUMN data_saida timestamp,
    ADD COLUMN documento_transferencia varchar(120);

ALTER TABLE animal
    ADD CONSTRAINT ck_animal_tipo_destino_transferencia CHECK (
        tipo_destino_transferencia IS NULL
        OR tipo_destino_transferencia IN ('ORGAO_PUBLICO', 'ENTIDADE_PROTECAO', 'OUTRO_CCZ', 'OUTRO'));

ALTER TABLE animal
    ADD CONSTRAINT ck_animal_transferencia_completa CHECK (
        (tipo_destino_transferencia IS NULL AND destino_transferencia IS NULL AND data_saida IS NULL)
        OR (tipo_destino_transferencia IS NOT NULL AND destino_transferencia IS NOT NULL AND data_saida IS NOT NULL));

ALTER TABLE animal
    ADD CONSTRAINT ck_animal_documento_exige_transferencia CHECK (
        documento_transferencia IS NULL OR data_saida IS NOT NULL);

COMMENT ON COLUMN animal.destino_transferencia IS 'Órgão ou entidade que recebeu o animal transferido (Portaria MS 1.138/2014, inc. XIII; Lei estadual nº 11.977/2005, art. 31)';
COMMENT ON COLUMN animal.tipo_destino_transferencia IS 'ORGAO_PUBLICO, ENTIDADE_PROTECAO, OUTRO_CCZ ou OUTRO; sem destino para experimentação nem adotante';
COMMENT ON COLUMN animal.data_saida IS 'Data e hora da saída do animal na transferência';
COMMENT ON COLUMN animal.documento_transferencia IS 'Número do ofício ou referência ao anexo do animal que documenta a transferência';
