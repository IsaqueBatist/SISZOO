-- Recalcula animal.ficha_completa nos dados existentes (DER §3.2:
-- "campos obrigatórios + microchip + ao menos 1 vacina";
-- docs/decisoes/animais-clinico-correcoes.md, AC-4).
--
-- Até esta branch a aplicação gravava ficha_completa = "tem microchip"
-- (TODO da cláusula da vacina em AnimalService). A regra passou a ser a do
-- DER, em FichaCompletaService: microchip com texto E ao menos uma vacinação
-- que nenhuma outra retifica. Toda cadeia de retificação termina num registro
-- não retificado, então isso equivale a "ao menos 1 vacinação registrada";
-- não há critério de validade/vencimento. Os campos obrigatórios já são
-- garantidos por NOT NULL (V4).
--
-- Efeito nos dados: animal com microchip e sem vacinação deixa de ser
-- "completo"; com microchip e com vacinação gravado como incompleto passa a
-- completo. Só a coluna ficha_completa muda, só nas linhas em que o valor
-- difere (nada mais é tocado: animal não tem trigger e atualizado_em é
-- mantido pela aplicação). Idempotente.
--
-- Numeração: V16 e V17 estão reservadas pela branch fix/auditoria-rn
-- (V16 normaliza o microchip). Esta migration precisa ser aplicada depois
-- delas: a fix/auditoria-rn tem de ser mesclada antes desta branch, senão um
-- banco já na V18 recusaria a V16/V17 (Flyway sem outOfOrder). `~ '\S'`
-- reproduz o StringUtils.hasText do serviço com ou sem a normalização da V16.

UPDATE animal a
   SET ficha_completa = calculado.completa
  FROM (SELECT x.id,
               COALESCE(x.microchip ~ '\S', false)
               AND EXISTS (SELECT 1
                             FROM vacinacao v
                            WHERE v.animal_id = x.id
                              AND NOT EXISTS (SELECT 1 FROM vacinacao r WHERE r.retifica_id = v.id))
                   AS completa
          FROM animal x) AS calculado
 WHERE calculado.id = a.id
   AND a.ficha_completa IS DISTINCT FROM calculado.completa;
