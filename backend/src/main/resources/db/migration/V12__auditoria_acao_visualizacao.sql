-- T26 — ações VISUALIZACAO e ENTREGA_INTERROMPIDA (DER §3.8).
--   VISUALIZACAO: acesso autorizado aos dados do denunciante de ocorrência
--     sigilosa (detalhe e download de anexo), gravado antes do envio do corpo.
--   ENTREGA_INTERROMPIDA: evento compensatório quando a escrita do corpo dessa
--     resposta falha depois do VISUALIZACAO já gravado (a auditoria só recebe
--     inserções; o evento original não é alterado).
--
-- Recria o CHECK de V2 com os novos valores: os 8 anteriores continuam válidos
-- e qualquer outro continua recusado. O Flyway roda a migration numa transação
-- (PostgreSQL), então DROP e ADD são atômicos; o ADD valida as linhas
-- existentes, todas dentro do conjunto novo. 'ENTREGA_INTERROMPIDA' tem
-- exatamente 20 caracteres: cabe em acao varchar(20). entidade_id (V9) não muda.
ALTER TABLE auditoria_evento DROP CONSTRAINT ck_auditoria_evento_acao;
ALTER TABLE auditoria_evento ADD CONSTRAINT ck_auditoria_evento_acao CHECK (acao IN (
    'CRIACAO', 'ATUALIZACAO', 'DESATIVACAO', 'REATIVACAO', 'LOGIN', 'LOGOUT', 'EXPORTACAO', 'ENCERRAMENTO',
    'VISUALIZACAO', 'ENTREGA_INTERROMPIDA'
));
