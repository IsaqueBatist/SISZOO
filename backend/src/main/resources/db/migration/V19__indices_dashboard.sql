-- Índices de apoio às agregações do dashboard (com.siszoo.relatorios, T38).
-- Banco só de testes: sem CONCURRENTLY, sem janela de manutenção a planejar.

-- Alerta "medicacao_ativa": prescricao WHERE status = 'ATIVA' AND
-- data_fim_prevista BETWEEN hoje E hoje+7d (DER §3.7).
CREATE INDEX ix_prescricao_status_data_fim_prevista ON prescricao (status, data_fim_prevista);

-- Gráfico "Resultados Laboratoriais": filtro por ano de data_resultado
-- (YEAR(p.dataResultado) = :ano). data_abertura já tem índice (V13); este
-- cobre o segundo filtro de ano usado pelo dashboard.
CREATE INDEX ix_processo_sanitario_data_resultado ON processo_sanitario (data_resultado);

-- Gráfico "Raiva por Espécie": GROUP BY a.especie.codigo em animal_amostrado,
-- hoje sem índice (só processo_id e animal_id, V13).
CREATE INDEX ix_animal_amostrado_especie_id ON animal_amostrado (especie_id);
