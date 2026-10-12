-- Correção de regra de acesso [fonte: ______]: o Veterinário não acessa o
-- módulo de ocorrências e denúncias. A V3 concedeu leitura por engano.
--
-- A V3 não é editada: a linha do Veterinário (UUID fixo da V3) é zerada aqui.
-- UPDATE em vez de DELETE mantém a linha explícita na matriz, como a de
-- USUARIOS_ACESSO do mesmo cargo na V3. Única linha do Veterinário no módulo:
-- a V10 concede `denunciante_sigiloso` só a Administrador e Agente Sanitário.
--
-- Idempotente: reexecutar não muda nada. As autoridades são resolvidas do
-- banco a cada requisição (JwtAuthenticationFilter), então a mudança vale na
-- hora, inclusive para tokens já emitidos.
UPDATE cargo_permissao
   SET leitura = false, escrita = false, exclusao = false
 WHERE cargo_id = '00000000-0000-4000-8000-000000000002'
   AND modulo = 'OCORRENCIAS_DENUNCIAS'
   AND feature = 'geral';
