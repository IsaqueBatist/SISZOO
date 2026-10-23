-- F2-007 / RF-A04 (Fase 3 do TG, 22/10/2026) — Anexos do animal (Quadro 69 do
-- TG: AnexoAnimal). Mesmo desenho dos anexos de ocorrência (V10, D9): metadados
-- em anexo_animal e o binário em tabela própria (bytea), lido só no download.
-- Tipos aceitos e limite iguais aos da ocorrência (JPG/PNG/PDF, até 5 MB; o
-- tipo é detectado pelos bytes iniciais no AnimalService). O Quadro 69 previa
-- "url"; a decisão de projeto (D9) é guardar o conteúdo no banco, sem URL.
CREATE TABLE anexo_animal (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    animal_id uuid NOT NULL,
    nome varchar(255) NOT NULL,
    mime_type varchar(50) NOT NULL,
    tamanho integer NOT NULL,
    descricao varchar(200),
    criado_por_id uuid NOT NULL,
    criado_em timestamp NOT NULL DEFAULT now(),
    CONSTRAINT pk_anexo_animal PRIMARY KEY (id),
    CONSTRAINT fk_anexo_animal_animal FOREIGN KEY (animal_id) REFERENCES animal (id),
    CONSTRAINT fk_anexo_animal_criado_por FOREIGN KEY (criado_por_id) REFERENCES usuario (id) ON DELETE RESTRICT,
    CONSTRAINT ck_anexo_animal_mime_type CHECK (mime_type IN ('image/jpeg', 'image/png', 'application/pdf')),
    CONSTRAINT ck_anexo_animal_tamanho CHECK (tamanho > 0 AND tamanho <= 5242880)
);

CREATE INDEX ix_anexo_animal_animal_id ON anexo_animal (animal_id);

CREATE TABLE anexo_animal_conteudo (
    anexo_id uuid NOT NULL,
    conteudo bytea NOT NULL,
    CONSTRAINT pk_anexo_animal_conteudo PRIMARY KEY (anexo_id),
    CONSTRAINT fk_anexo_animal_conteudo_anexo FOREIGN KEY (anexo_id) REFERENCES anexo_animal (id)
);

COMMENT ON TABLE anexo_animal IS 'Documentos e fotos anexados ao animal (RF-A04, Quadro 69); conteúdo em anexo_animal_conteudo';
