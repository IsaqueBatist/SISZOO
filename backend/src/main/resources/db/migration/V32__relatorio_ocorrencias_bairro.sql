-- Dados agregados de ocorrências por bairro (decisão funcional de 31/10/2026)
--
-- O Veterinário já não acessa o módulo de ocorrências (V11), mas lia as mesmas
-- contagens por `RELATORIOS:leitura`. Feature própria no módulo de relatórios,
-- no padrão de `denunciante_sigiloso` (V10): gera
-- RELATORIOS:ocorrencias_bairro:leitura para Administrador e Agente Sanitário.
-- O Veterinário não recebe linha e continua com os demais relatórios.

INSERT INTO cargo_permissao (cargo_id, modulo, feature, leitura, escrita, exclusao) VALUES
    ('00000000-0000-4000-8000-000000000001', 'RELATORIOS', 'ocorrencias_bairro', true, false, false),
    ('00000000-0000-4000-8000-000000000003', 'RELATORIOS', 'ocorrencias_bairro', true, false, false)
ON CONFLICT (cargo_id, modulo, feature) DO NOTHING;
