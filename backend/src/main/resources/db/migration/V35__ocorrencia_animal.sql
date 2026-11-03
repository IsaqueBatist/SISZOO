ALTER TABLE ocorrencia
    ADD COLUMN animal_id uuid;

ALTER TABLE ocorrencia
    ADD CONSTRAINT fk_ocorrencia_animal FOREIGN KEY (animal_id) REFERENCES animal (id);

CREATE UNIQUE INDEX uk_ocorrencia_animal ON ocorrencia (animal_id);

COMMENT ON COLUMN ocorrencia.animal_id IS 'Animal recolhido em atendimento a esta ocorrência (Portaria MS 1.138/2014, inc. X); no máximo um por ocorrência e uma ocorrência por animal';
