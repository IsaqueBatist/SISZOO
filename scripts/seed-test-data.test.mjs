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

async function totalAuditoria() {
  return (await client.query("SELECT count(*)::int AS n FROM auditoria_evento")).rows[0].n;
}

async function estadoDoAnimal(id) {
  return (await client.query("SELECT ficha_completa, atualizado_em FROM animal WHERE id = $1", [id])).rows[0];
}

test("execução repetida do seed não chama a API nem gera auditoria", async () => {
  const antes = await totalAuditoria();
  const saida = rodarSeed();
  assert.equal(await totalAuditoria(), antes, "nenhum evento novo (nem usuario/LOGIN)");
  assert.match(saida, /ficha_corrigida_do_seed_anterior: 0/);
});

// Por último: altera animais do seed para simular o banco semeado pela
// versão anterior, que gravava ficha_completa = "tem microchip" direto no
// INSERT (ficha true sem passar pelo backend, atualizado_em = criado_em).
test("o seed corrige pela API a ficha gravada pela versão anterior, uma vez só", async () => {
  const doSeed = (condicao) =>
    client.query(`SELECT a.id FROM animal a WHERE a.id::text LIKE '40000000-%' AND ${condicao} ORDER BY a.id LIMIT 1`);
  const errada = (await doSeed(`${TEM_MICROCHIP} AND NOT ${TEM_VACINA_VIGENTE}`)).rows[0]?.id;
  const certa = (await doSeed(`${TEM_MICROCHIP} AND ${TEM_VACINA_VIGENTE}`)).rows[0]?.id;
  assert.ok(errada, "o seed devia ter um animal com microchip e sem vacinação");
  assert.ok(certa, "o seed devia ter um animal com microchip e vacinação");
  // Errada: completa sem vacina. Certa: completa com vacina, nunca tocada.
  await client.query("UPDATE animal SET ficha_completa = true, atualizado_em = criado_em WHERE id = ANY($1::uuid[])", [
    [errada, certa],
  ]);
  const certaAntes = await estadoDoAnimal(certa);

  const primeira = rodarSeed();
  const erradaDepois = await estadoDoAnimal(errada);
  assert.equal(erradaDepois.ficha_completa, false);
  assert.match(primeira, /ficha_corrigida_do_seed_anterior: [1-9]/);
  assert.deepEqual(await estadoDoAnimal(certa), certaAntes, "a ficha certa não deve ser regravada");

  const auditoriaAntes = await totalAuditoria();
  const segunda = rodarSeed();
  assert.equal(await totalAuditoria(), auditoriaAntes, "a segunda execução não deve gerar auditoria");
  assert.deepEqual(await estadoDoAnimal(errada), erradaDepois, "a segunda execução não deve tocar no animal");
  assert.deepEqual(await estadoDoAnimal(certa), certaAntes);
  assert.match(segunda, /ficha_corrigida_do_seed_anterior: 0/);
});
