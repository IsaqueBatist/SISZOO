-- Remove a tabela `sessao` criada em V2 e nunca usada.
--
-- A autenticação é JWT stateless (SecurityConfig: SessionCreationPolicy.STATELESS):
-- o token não é persistido, e nenhuma entidade, repositório ou query lê ou
-- grava `sessao`. Nenhuma FK aponta para ela; a única FK é a de saída
-- (fk_sessao_usuario), removida junto com a tabela, assim como o índice
-- ix_sessao_usuario_id e as constraints pk_/uq_.
-- IF EXISTS deixa o passo reexecutável sem erro.
DROP TABLE IF EXISTS sessao;
