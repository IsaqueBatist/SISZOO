-- Edição de processo sanitário já registrado (decisão funcional de 31/10/2026)
--
-- Só o Administrador edita. Feature própria, no padrão de `denunciante_sigiloso`
-- (V10): a linha gera PROCESSOS_SANITARIOS:edicao_registro:escrita e não concede
-- o módulo inteiro. Veterinário e Agente Sanitário não recebem linha, e continuam
-- com a escrita do fluxo (criar, avançar status, lançar resultado).

INSERT INTO cargo_permissao (cargo_id, modulo, feature, leitura, escrita, exclusao) VALUES
    ('00000000-0000-4000-8000-000000000001', 'PROCESSOS_SANITARIOS', 'edicao_registro', false, true, false)
ON CONFLICT (cargo_id, modulo, feature) DO NOTHING;
