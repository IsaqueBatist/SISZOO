// Invariante de animal.ficha_completa (DER §3.2) depois do seed, sobre todos
// os animais do banco, sem depender de nomes ou ids do seed.
//
// Integração: precisa do Postgres e do backend no ar (as mesmas variáveis do
// seed: SEED_DB_HOST, SEED_DB_PORT, POSTGRES_*, SEED_API_URL). Rode num banco
// recém-criado: um banco semeado pela versão antiga do seed (que gravava
// ficha_completa = "tem microchip") falha aqui até ser recriado.
//
//   npm run test:seed

import "dotenv/config";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import pg from "pg";

const SEED = fileURLToPath(new URL("./seed-test-data.mjs", import.meta.url));

// Vacinação vigente: nenhuma outra a retifica.
const TEM_VACINA_VIGENTE = `EXISTS (SELECT 1 FROM vacinacao v
                                     WHERE v.animal_id = a.id
                                       AND NOT EXISTS (SELECT 1 FROM vacinacao r WHERE r.retifica_id = v.id))`;
const TEM_MICROCHIP = `COALESCE(a.microchip ~ '\\S', false)`;

let client;

before(async () => {
  const seed = spawnSync(process.execPath, [SEED], { encoding: "utf8" });
  assert.equal(seed.status, 0, `seed falhou:\n${seed.stdout}\n${seed.stderr}`);

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
