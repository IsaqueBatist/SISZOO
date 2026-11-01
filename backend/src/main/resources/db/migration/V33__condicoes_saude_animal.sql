-- Condições de saúde pré-existentes do animal
--
-- Pedido da Veterinária na entrevista de 09/01/2026 ("campo de condições
-- especiais (epilepsia, agressividade)"). As opções e o nome vêm do protótipo
-- (docs/prototipo/cadastrar-animal.html), e a forma foi aprovada em 31/10/2026
-- (docs/decisoes/decisoes-funcionais.md). Não confundir com o texto livre
-- `animal.observacoes`, que continua como está.
--
-- Catálogo + N:N, no padrão de sintoma/amostra_sintoma (V13). `outras` exige o
-- texto de animal.condicoes_outras, regra aplicada no AnimalService.
--
-- Aditiva: nenhum dado existente muda. Animais antigos ficam sem condição
-- marcada, o que não afirma que não tenham nenhuma.

CREATE TABLE condicao_saude (
    id     uuid         NOT NULL DEFAULT gen_random_uuid(),
    codigo varchar(30)  NOT NULL,
    nome   varchar(100) NOT NULL,
    ativo  boolean      NOT NULL DEFAULT true,
    CONSTRAINT pk_condicao_saude PRIMARY KEY (id),
    CONSTRAINT uq_condicao_saude_codigo UNIQUE (codigo)
);

INSERT INTO condicao_saude (codigo, nome) VALUES
    ('epilepsia', 'Epilepsia'),
    ('cardiopatia', 'Cardiopatia'),
    ('diabetes', 'Diabetes'),
    ('agressividade', 'Agressividade'),
    ('cegueira', 'Cegueira'),
    ('surdez', 'Surdez'),
    ('outras', 'Outras')
ON CONFLICT (codigo) DO NOTHING;

CREATE TABLE animal_condicao_saude (
    animal_id         uuid NOT NULL,
    condicao_saude_id uuid NOT NULL,
    CONSTRAINT pk_animal_condicao_saude PRIMARY KEY (animal_id, condicao_saude_id),
    CONSTRAINT fk_animal_condicao_saude_animal FOREIGN KEY (animal_id) REFERENCES animal (id) ON DELETE CASCADE,
    CONSTRAINT fk_animal_condicao_saude_condicao FOREIGN KEY (condicao_saude_id) REFERENCES condicao_saude (id)
);

CREATE INDEX ix_animal_condicao_saude_condicao_saude_id ON animal_condicao_saude (condicao_saude_id);

ALTER TABLE animal ADD COLUMN condicoes_outras varchar(500);
