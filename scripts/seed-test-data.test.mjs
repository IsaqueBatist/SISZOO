// Invariante de animal.ficha_completa (DER §3.2) depois do seed, sobre todos
// os animais do banco, sem depender de nomes ou ids do seed.
//
// Integração: precisa do Postgres e do backend no ar (as mesmas variáveis do
// seed: SEED_DB_HOST, SEED_DB_PORT, POSTGRES_*, SEED_API_URL). Num banco
// semeado pela versão antiga do seed (que gravava ficha_completa = "tem
// microchip"), o próprio seed rodado pelo before() corrige as fichas.
//
//   npm run test:seed

import "dotenv/config";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import pg from "pg";

const SEED = fileURLToPath(new URL("./seed-test-data.mjs", import.meta.url));

function rodarSeed() {
  const seed = spawnSync(process.execPath, [SEED], { encoding: "utf8" });
  assert.equal(seed.status, 0, `seed falhou:\n${seed.stdout}\n${seed.stderr}`);
  return seed.stdout;
}

// Vacinação vigente: nenhuma outra a retifica.
const TEM_VACINA_VIGENTE = `EXISTS (SELECT 1 FROM vacinacao v
                                     WHERE v.animal_id = a.id
                                       AND NOT EXISTS (SELECT 1 FROM vacinacao r WHERE r.retifica_id = v.id))`;
const TEM_MICROCHIP = `COALESCE(a.microchip ~ '\\S', false)`;

let client;

before(async () => {
  rodarSeed();

  client = new pg.Client({
    host: process.env.SEED_DB_HOST ?? "localhost",
    port: Number(process.env.SEED_DB_PORT ?? 5432),
    database: process.env.POSTGRES_DB ?? "siszoo",
    user: process.env.POSTGRES_USER ?? "postgres",
    password: process.env.POSTGRES_PASSWORD ?? "postgres",
  });
  await client.connect();
});

after(async () => {
  await client?.end();
});

async function nomes(condicao) {
  const { rows } = await client.query(`SELECT a.nome FROM animal a WHERE ${condicao} ORDER BY a.nome`);
  return rows.map((r) => r.nome);
}

test("nenhum animal com ficha completa sem vacinação vigente", async () => {
  assert.deepEqual(await nomes(`a.ficha_completa AND NOT ${TEM_VACINA_VIGENTE}`), []);
});

test("nenhum animal com ficha completa sem microchip", async () => {
  assert.deepEqual(await nomes(`a.ficha_completa AND NOT ${TEM_MICROCHIP}`), []);
});

test("nenhum animal com microchip e vacinação vigente marcado como incompleto", async () => {
  assert.deepEqual(await nomes(`NOT a.ficha_completa AND ${TEM_MICROCHIP} AND ${TEM_VACINA_VIGENTE}`), []);
});

test("o seed produz fichas completas e incompletas (o invariante não passa por vazio)", async () => {
  const { rows } = await client.query(
    "SELECT count(*) FILTER (WHERE ficha_completa)::int AS completas, count(*) FILTER (WHERE NOT ficha_completa)::int AS incompletas FROM animal",
  );
  assert.ok(rows[0].completas > 0, "nenhuma ficha completa");
  assert.ok(rows[0].incompletas > 0, "nenhuma ficha incompleta");
});

// Por último: altera um animal do seed para simular o banco semeado pela
// versão anterior, que gravava ficha_completa = "tem microchip" direto no
// INSERT (ficha true sem passar pelo backend, atualizado_em = criado_em).
test("o seed corrige pela API a ficha gravada pela versão anterior, uma vez só", async () => {
  const { rows } = await client.query(
    `SELECT a.id FROM animal a
      WHERE a.id::text LIKE '40000000-%' AND ${TEM_MICROCHIP} AND NOT ${TEM_VACINA_VIGENTE}
      ORDER BY a.id LIMIT 1`,
  );
  assert.equal(rows.length, 1, "o seed devia ter um animal com microchip e sem vacinação");
  const id = rows[0].id;
  await client.query("UPDATE animal SET ficha_completa = true, atualizado_em = criado_em WHERE id = $1", [id]);

  const primeira = rodarSeed();
  const depois = (await client.query("SELECT ficha_completa, atualizado_em FROM animal WHERE id = $1", [id])).rows[0];
  assert.equal(depois.ficha_completa, false);
  assert.match(primeira, /ficha_corrigida_do_seed_anterior: [1-9]/);

  const segunda = rodarSeed();
  const deNovo = (await client.query("SELECT ficha_completa, atualizado_em FROM animal WHERE id = $1", [id])).rows[0];
  assert.equal(deNovo.ficha_completa, false);
  assert.deepEqual(deNovo.atualizado_em, depois.atualizado_em, "a segunda execução não deve tocar no animal");
  assert.match(segunda, /ficha_corrigida_do_seed_anterior: 0/);
});
