-- T26 — ação VISUALIZACAO: acesso autorizado aos dados do denunciante de
-- ocorrência sigilosa (detalhe e download de anexo), DER §3.8.
--
-- Recria o CHECK de V2 com o novo valor: os 8 anteriores continuam válidos e
-- qualquer outro continua recusado. O Flyway roda a migration numa transação
-- (PostgreSQL), então DROP e ADD são atômicos; o ADD valida as linhas
-- existentes, todas dentro do conjunto novo. 'VISUALIZACAO' (12 caracteres)
-- cabe em acao varchar(20). entidade_id (V9) não muda.
ALTER TABLE auditoria_evento DROP CONSTRAINT ck_auditoria_evento_acao;
ALTER TABLE auditoria_evento ADD CONSTRAINT ck_auditoria_evento_acao CHECK (acao IN (
    'CRIACAO', 'ATUALIZACAO', 'DESATIVACAO', 'REATIVACAO', 'LOGIN', 'LOGOUT', 'EXPORTACAO', 'ENCERRAMENTO',
    'VISUALIZACAO'
));
