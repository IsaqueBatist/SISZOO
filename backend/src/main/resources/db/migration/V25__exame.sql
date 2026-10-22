-- F2-007 / RF-A04 (Fase 3 do TG, 22/10/2026) — Exames do animal do canil
-- (Quadros 76 e 77 do TG: TipoExame e Exame).
--
-- Mesmo desenho dos demais registros clínicos (V5/V6/V17): catálogo em tabela
-- com código, registro IMUTÁVEL com retificação por nova linha (retifica_id
-- aponta para o registro corrigido; UNIQUE garante uma única correção por
-- registro) e triggers que recusam DELETE/TRUNCATE (funções da V17).
-- laboratorio_id reutiliza o catálogo de laboratórios do módulo de processos
-- (V13), como o Quadro 77 prevê. Datas sem fuso (America/Sao_Paulo).
CREATE TABLE tipo_exame (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    codigo varchar(30) NOT NULL,
    nome varchar(100) NOT NULL,
    ativo boolean NOT NULL DEFAULT true,
    CONSTRAINT pk_tipo_exame PRIMARY KEY (id),
    CONSTRAINT uq_tipo_exame_codigo UNIQUE (codigo)
);

INSERT INTO tipo_exame (codigo, nome) VALUES
    ('hemograma', 'Hemograma'),
    ('bioquimico', 'Bioquímico sérico'),
    ('parasitologico', 'Parasitológico de fezes'),
    ('raspado_pele', 'Raspado de pele'),
    ('citologia', 'Citologia'),
    ('sorologia', 'Sorologia'),
    ('urinalise', 'Urinálise'),
    ('radiografia', 'Radiografia'),
    ('ultrassonografia', 'Ultrassonografia')
ON CONFLICT (codigo) DO NOTHING;

CREATE TABLE exame (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    animal_id uuid NOT NULL,
    tipo_exame_id uuid NOT NULL,
    laboratorio_id uuid,
    solicitado_por_id uuid,
    data_solicitacao date NOT NULL,
    data_resultado date,
    resultado text,
    observacoes text,
    retifica_id uuid,
    criado_em timestamp NOT NULL DEFAULT now(),
    CONSTRAINT pk_exame PRIMARY KEY (id),
    CONSTRAINT fk_exame_animal FOREIGN KEY (animal_id) REFERENCES animal (id),
    CONSTRAINT fk_exame_tipo_exame FOREIGN KEY (tipo_exame_id) REFERENCES tipo_exame (id),
    CONSTRAINT fk_exame_laboratorio FOREIGN KEY (laboratorio_id) REFERENCES laboratorio (id),
    CONSTRAINT fk_exame_usuario FOREIGN KEY (solicitado_por_id) REFERENCES usuario (id) ON DELETE RESTRICT,
    CONSTRAINT fk_exame_retifica FOREIGN KEY (retifica_id) REFERENCES exame (id),
    CONSTRAINT uq_exame_retifica_id UNIQUE (retifica_id),
    CONSTRAINT ck_exame_datas CHECK (data_resultado IS NULL OR data_resultado >= data_solicitacao)
);

CREATE INDEX ix_exame_animal_id ON exame (animal_id);
CREATE INDEX ix_exame_tipo_exame_id ON exame (tipo_exame_id);

CREATE TRIGGER tg_exame_sem_exclusao BEFORE DELETE ON exame
    FOR EACH ROW EXECUTE FUNCTION fn_registro_critico_sem_exclusao();
CREATE TRIGGER tg_exame_sem_truncate BEFORE TRUNCATE ON exame
    FOR EACH STATEMENT EXECUTE FUNCTION fn_registro_critico_sem_truncate();

COMMENT ON TABLE exame IS 'Exame laboratorial/imagem do animal do canil (RF-A04); registro clínico imutável, correção por nova linha (retifica_id)';
