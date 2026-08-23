-- Seed dos 3 cargos e da matriz de permissões (DER.md §3.1, granularidade de módulo)
-- UUIDs fixos para permitir seed idempotente e referência estável por outras camadas.

INSERT INTO cargo (id, nome, descricao) VALUES
    ('00000000-0000-4000-8000-000000000001', 'Administrador', 'Acesso completo a todos os módulos do sistema.'),
    ('00000000-0000-4000-8000-000000000002', 'Veterinário', 'Responsável clínico: animais, vacinação, procedimentos e processos sanitários.'),
    ('00000000-0000-4000-8000-000000000003', 'Agente Sanitário', 'Atendimento de ocorrências e denúncias, apoio em processos sanitários.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO cargo_permissao (cargo_id, modulo, feature, leitura, escrita, exclusao) VALUES
    -- Administrador
    ('00000000-0000-4000-8000-000000000001', 'USUARIOS_ACESSO',       'geral', true,  true,  true),
    ('00000000-0000-4000-8000-000000000001', 'GESTAO_ANIMAIS',        'geral', true,  true,  true),
    ('00000000-0000-4000-8000-000000000001', 'OCORRENCIAS_DENUNCIAS', 'geral', true,  true,  true),
    ('00000000-0000-4000-8000-000000000001', 'PROCESSOS_SANITARIOS',  'geral', true,  true,  true),
    ('00000000-0000-4000-8000-000000000001', 'RELATORIOS',            'geral', true,  false, false),
    -- Veterinário
    ('00000000-0000-4000-8000-000000000002', 'USUARIOS_ACESSO',       'geral', false, false, false),
    ('00000000-0000-4000-8000-000000000002', 'GESTAO_ANIMAIS',        'geral', true,  true,  false),
    ('00000000-0000-4000-8000-000000000002', 'OCORRENCIAS_DENUNCIAS', 'geral', true,  false, false),
    ('00000000-0000-4000-8000-000000000002', 'PROCESSOS_SANITARIOS',  'geral', true,  true,  false),
    ('00000000-0000-4000-8000-000000000002', 'RELATORIOS',            'geral', true,  false, false),
    -- Agente Sanitário
    ('00000000-0000-4000-8000-000000000003', 'USUARIOS_ACESSO',       'geral', false, false, false),
    ('00000000-0000-4000-8000-000000000003', 'GESTAO_ANIMAIS',        'geral', true,  false, false),
    ('00000000-0000-4000-8000-000000000003', 'OCORRENCIAS_DENUNCIAS', 'geral', true,  true,  false),
    ('00000000-0000-4000-8000-000000000003', 'PROCESSOS_SANITARIOS',  'geral', true,  true,  false),
    ('00000000-0000-4000-8000-000000000003', 'RELATORIOS',            'geral', true,  false, false)
ON CONFLICT (cargo_id, modulo, feature) DO NOTHING;
