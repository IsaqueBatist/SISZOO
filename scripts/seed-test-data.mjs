// Popula o Postgres do docker-compose com dados de teste para uso manual
// (login, listagem de animais, ficha clínica). Idempotente: nunca faz
// UPDATE/DELETE, só insere o que ainda não existe (mesma técnica de
// V3__seed_cargos.sql: UUIDs fixos + ON CONFLICT DO NOTHING).
//
// Escopo: usuários/cargos, animais e clínico — os únicos módulos que já
// existem em schema (V1-V6). Ocorrências/Processos/Relatórios não têm
// tabela ainda, então não são semeados aqui.
//
// Pré-requisito: Postgres do docker-compose no ar e migrations Flyway já
// aplicadas (suba o backend uma vez: `docker compose up` ou
// `mvn spring-boot:run`).

import "dotenv/config";
import bcrypt from "bcryptjs";
import pg from "pg";

const SENHA_TESTE = "Teste@123";

const CARGO = {
  ADMINISTRADOR: "00000000-0000-4000-8000-000000000001",
  VETERINARIO: "00000000-0000-4000-8000-000000000002",
  AGENTE_SANITARIO: "00000000-0000-4000-8000-000000000003",
};

function id(grupo, indice) {
  return `${grupo}-0000-4000-8000-${String(indice).padStart(12, "0")}`;
}

// Atenção: o e-mail institucional é validado pela regex crítica
// `^[a-z.]+@itu\.sp\.gov\.br$` (só letras minúsculas e ponto — sem dígitos,
// sem underscore). Usar nomes por extenso em vez de sufixo numérico.
const USUARIOS = [
  { id: id("10000000", 1), email: "ana.admin.teste@itu.sp.gov.br", nome: "Ana", sobrenome: "Administradora", cargoId: CARGO.ADMINISTRADOR },
  { id: id("10000000", 2), email: "bruno.veterinario.teste@itu.sp.gov.br", nome: "Bruno", sobrenome: "Veterinário", cargoId: CARGO.VETERINARIO, crmv: "SP-12345" },
  { id: id("10000000", 3), email: "carla.veterinaria.teste@itu.sp.gov.br", nome: "Carla", sobrenome: "Veterinária", cargoId: CARGO.VETERINARIO, crmv: "SP-54321" },
  { id: id("10000000", 4), email: "diego.agente.teste@itu.sp.gov.br", nome: "Diego", sobrenome: "Agente", cargoId: CARGO.AGENTE_SANITARIO },
  { id: id("10000000", 5), email: "elis.agente.teste@itu.sp.gov.br", nome: "Elis", sobrenome: "Agente", cargoId: CARGO.AGENTE_SANITARIO },
];

const CATEGORIAS_FARMACOLOGICAS = [
  { id: id("20000000", 1), nome: "Antibiótico" },
  { id: id("20000000", 2), nome: "Anti-inflamatório" },
  { id: id("20000000", 3), nome: "Antiparasitário" },
];

const MEDICAMENTOS = [
  { id: id("21000000", 1), nome: "Amoxicilina", categoriaId: CATEGORIAS_FARMACOLOGICAS[0].id },
  { id: id("21000000", 2), nome: "Enrofloxacina", categoriaId: CATEGORIAS_FARMACOLOGICAS[0].id },
  { id: id("21000000", 3), nome: "Meloxicam", categoriaId: CATEGORIAS_FARMACOLOGICAS[1].id },
  { id: id("21000000", 4), nome: "Dipirona", categoriaId: CATEGORIAS_FARMACOLOGICAS[1].id },
  { id: id("21000000", 5), nome: "Ivermectina", categoriaId: CATEGORIAS_FARMACOLOGICAS[2].id },
  { id: id("21000000", 6), nome: "Fipronil", categoriaId: CATEGORIAS_FARMACOLOGICAS[2].id },
];

const TIPOS_BAIA = ["interna", "gatil", "externa"];
const BAIAS = Array.from({ length: 8 }, (_, i) => ({
  id: id("30000000", i + 1),
  nome: `Baia ${String(i + 1).padStart(2, "0")}`,
  tipoBaiaCodigo: TIPOS_BAIA[i % TIPOS_BAIA.length],
  capacidade: 2 + (i % 3),
}));

const ESPECIES = ["canino", "felino", "quiroptero", "pnh"];
const STATUS_ANIMAL = [
  "disponivel_adocao",
  "em_tratamento",
  "em_quarentena",
  "adotado",
  "obito_natural",
  "obito_eutanasia",
  "transferido",
];
const STATUS_COM_BAIA = new Set(["disponivel_adocao", "em_tratamento", "em_quarentena"]);
const MOTIVOS_ENTRADA = ["recolhimento", "abandono", "entrega_voluntaria", "resgate", "apreensao_judicial"];
const SEXOS = ["macho", "femea", "nao_identificado"];
const PELAGENS = ["curta", "longa", null];
const PORTES = ["pequeno", "medio", "grande"];
const RACAS = ["SRD", "Labrador", "Poodle", "Siamês", "Persa", "Pastor Alemão"];
const COLORACOES = ["Preto", "Branco", "Caramelo", "Cinza", "Malhado", "Tricolor"];
const NOMES_ANIMAIS = [
  "Rex", "Bela", "Thor", "Mel", "Simba", "Luna", "Bob", "Nina", "Max", "Lola",
  "Toby", "Amora", "Bidu", "Mimi", "Fred", "Duda", "Zeus", "Pipoca", "Bento", "Nala",
  "Apolo", "Gaia", "Rocky", "Pandora", "Bolt", "Sasha", "Frajola", "Pingo", "Chico", "Estrela",
];

const TOTAL_ANIMAIS = NOMES_ANIMAIS.length;
const ANIMAIS = Array.from({ length: TOTAL_ANIMAIS }, (_, i) => {
  const indice = i + 1;
  const especieCodigo = ESPECIES[i % ESPECIES.length];
  const statusCodigo = STATUS_ANIMAL[i % STATUS_ANIMAL.length];
  const temMicrochip = i % 2 === 0;
  const isDomestico = especieCodigo === "canino" || especieCodigo === "felino";
  return {
    id: id("40000000", indice),
    nome: NOMES_ANIMAIS[i],
    especieCodigo,
    sexo: SEXOS[i % SEXOS.length],
    raca: isDomestico ? RACAS[i % RACAS.length] : null,
    coloracao: COLORACOES[i % COLORACOES.length],
    pelagem: PELAGENS[i % PELAGENS.length],
    porte: PORTES[i % PORTES.length],
    pesoKg: (2 + (i % 3) * 6.5).toFixed(2),
    idadeAprox: i % 2 === 0 ? `${1 + (i % 8)} anos` : `${2 + (i % 10)} meses`,
    microchip: temMicrochip ? `90000000000${String(indice).padStart(3, "0")}` : null,
    esterilizado: i % 3 === 0,
    statusCodigo,
    motivoEntradaCodigo: MOTIVOS_ENTRADA[i % MOTIVOS_ENTRADA.length],
    diasDesdeEntrada: 5 + i * 3,
    baiaId: STATUS_COM_BAIA.has(statusCodigo) ? BAIAS[i % BAIAS.length].id : null,
    fichaCompleta: i % 2 === 0,
    observacoes: null,
    criadoPorId: USUARIOS[(i % 4) + 1].id,
  };
});

const VACINAS_CODIGOS = [
  "antirrabica", "v10", "v8", "v4_felinos", "giardia", "gripe_canina", "felv", "leishmaniose",
];
const TOTAL_VACINACOES = 20;
const VACINACOES = Array.from({ length: TOTAL_VACINACOES }, (_, i) => ({
  id: id("50000000", i + 1),
  animalId: ANIMAIS[i % ANIMAIS.length].id,
  vacinaCodigo: VACINAS_CODIGOS[i % VACINAS_CODIGOS.length],
  aplicadoPorId: USUARIOS[1 + (i % 2)].id,
  diasDesdeAplicacao: 10 + i * 5,
  numeroDose: (i % 2) + 1,
  doseQuantidade: "1.000",
  doseUnidade: "MILILITRO",
  lote: `LT${String(i + 1).padStart(4, "0")}`,
  retificaId: null,
}));
// Exemplo de retificação: corrige o lote da primeira vacinação sem alterar a linha original.
VACINACOES.push({
  id: id("50000000", TOTAL_VACINACOES + 1),
  animalId: VACINACOES[0].animalId,
  vacinaCodigo: VACINACOES[0].vacinaCodigo,
  aplicadoPorId: VACINACOES[0].aplicadoPorId,
  diasDesdeAplicacao: VACINACOES[0].diasDesdeAplicacao,
  numeroDose: VACINACOES[0].numeroDose,
  doseQuantidade: VACINACOES[0].doseQuantidade,
  doseUnidade: VACINACOES[0].doseUnidade,
  lote: "LT0001-CORRIGIDO",
  retificaId: VACINACOES[0].id,
});

const TIPOS_PROCEDIMENTO_CODIGOS = ["atendimento_clinico", "castracao", "cirurgia_maior", "vacinacao"];
const TOTAL_PROCEDIMENTOS = 15;
const PROCEDIMENTOS = Array.from({ length: TOTAL_PROCEDIMENTOS }, (_, i) => ({
  id: id("60000000", i + 1),
  animalId: ANIMAIS[i % ANIMAIS.length].id,
  tipoProcedimentoCodigo: TIPOS_PROCEDIMENTO_CODIGOS[i % TIPOS_PROCEDIMENTO_CODIGOS.length],
  executadoPorId: USUARIOS[1 + (i % 2)].id,
  diasDesde: 8 + i * 4,
  descricao: "Atendimento de rotina registrado para dados de teste.",
  resultado: "Sem alterações significativas.",
  retificaId: null,
}));
PROCEDIMENTOS.push({
  id: id("60000000", TOTAL_PROCEDIMENTOS + 1),
  animalId: PROCEDIMENTOS[0].animalId,
  tipoProcedimentoCodigo: PROCEDIMENTOS[0].tipoProcedimentoCodigo,
  executadoPorId: PROCEDIMENTOS[0].executadoPorId,
  diasDesde: PROCEDIMENTOS[0].diasDesde,
  descricao: PROCEDIMENTOS[0].descricao,
  resultado: "Resultado corrigido: leve alteração observada em reavaliação.",
  retificaId: PROCEDIMENTOS[0].id,
});

const UNIDADES_FREQUENCIA = ["HORAS", "DIAS"];
const VIAS_ADMINISTRACAO = ["ORAL", "INTRAVENOSA", "INTRAMUSCULAR", "SUBCUTANEA", "TOPICA"];
const STATUS_PRESCRICAO = ["ATIVA", "CONCLUIDA", "SUSPENSA", "CANCELADA"];
const TOTAL_PRESCRICOES = 10;
const PRESCRICOES = Array.from({ length: TOTAL_PRESCRICOES }, (_, i) => ({
  id: id("70000000", i + 1),
  animalId: ANIMAIS[i % ANIMAIS.length].id,
  medicamentoId: MEDICAMENTOS[i % MEDICAMENTOS.length].id,
  prescritoPorId: USUARIOS[1 + (i % 2)].id,
  diasDesdeInicio: 6 + i * 3,
  frequenciaAplicada: 8 + (i % 3) * 4,
  unidadeFrequencia: UNIDADES_FREQUENCIA[i % UNIDADES_FREQUENCIA.length],
  doseQuantidade: "10.000",
  doseUnidade: "MILIGRAMA",
  viaAdministracao: VIAS_ADMINISTRACAO[i % VIAS_ADMINISTRACAO.length],
  status: STATUS_PRESCRICAO[i % STATUS_PRESCRICAO.length],
  retificaId: null,
}));
PRESCRICOES.push({
  id: id("70000000", TOTAL_PRESCRICOES + 1),
  animalId: PRESCRICOES[0].animalId,
  medicamentoId: PRESCRICOES[0].medicamentoId,
  prescritoPorId: PRESCRICOES[0].prescritoPorId,
  diasDesdeInicio: PRESCRICOES[0].diasDesdeInicio,
  frequenciaAplicada: PRESCRICOES[0].frequenciaAplicada,
  unidadeFrequencia: PRESCRICOES[0].unidadeFrequencia,
  doseQuantidade: PRESCRICOES[0].doseQuantidade,
  doseUnidade: PRESCRICOES[0].doseUnidade,
  viaAdministracao: PRESCRICOES[0].viaAdministracao,
  status: "CANCELADA",
  retificaId: PRESCRICOES[0].id,
});

async function tabelaExiste(client, nome) {
  const { rows } = await client.query(
    "SELECT 1 FROM information_schema.tables WHERE table_name = $1",
    [nome],
  );
  return rows.length > 0;
}

async function mapaPorCodigo(client, tabela) {
  const { rows } = await client.query(`SELECT id, codigo FROM ${tabela}`);
  return Object.fromEntries(rows.map((r) => [r.codigo, r.id]));
}

function dataPassada(dias) {
  const data = new Date();
  data.setDate(data.getDate() - dias);
  return data;
}

async function seed() {
  const client = new pg.Client({
    host: process.env.SEED_DB_HOST ?? "localhost",
    port: Number(process.env.SEED_DB_PORT ?? 5432),
    database: process.env.POSTGRES_DB ?? "siszoo",
    user: process.env.POSTGRES_USER ?? "postgres",
    password: process.env.POSTGRES_PASSWORD ?? "postgres",
  });

  await client.connect();

  const contagens = {};
  const registrar = async (tabela, textoSql, valores) => {
    const resultado = await client.query(textoSql, valores);
    contagens[tabela] = (contagens[tabela] ?? 0) + resultado.rowCount;
  };

  try {
    if (!(await tabelaExiste(client, "flyway_schema_history"))) {
      throw new Error(
        "Nenhuma migration do Flyway encontrada. Suba o backend antes (docker compose up, ou mvn spring-boot:run) para aplicar as migrations e só então rode o seed.",
      );
    }

    await client.query("BEGIN");

    const especieIdPorCodigo = await mapaPorCodigo(client, "especie");
    const statusAnimalIdPorCodigo = await mapaPorCodigo(client, "status_animal");
    const motivoEntradaIdPorCodigo = await mapaPorCodigo(client, "motivo_entrada");
    const tipoBaiaIdPorCodigo = await mapaPorCodigo(client, "tipo_baia");
    const vacinaIdPorCodigo = await mapaPorCodigo(client, "vacina");
    const tipoProcedimentoIdPorCodigo = await mapaPorCodigo(client, "tipo_procedimento");

    const senhaHash = bcrypt.hashSync(SENHA_TESTE, 10);
    for (const usuario of USUARIOS) {
      await registrar(
        "usuario",
        `INSERT INTO usuario (id, email, senha, nome, sobrenome, crmv)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (email) DO NOTHING`,
        [usuario.id, usuario.email, senhaHash, usuario.nome, usuario.sobrenome, usuario.crmv ?? null],
      );
      await registrar(
        "usuario_cargo",
        `INSERT INTO usuario_cargo (usuario_id, cargo_id)
         VALUES ($1, $2)
         ON CONFLICT (usuario_id, cargo_id) DO NOTHING`,
        [usuario.id, usuario.cargoId],
      );
      await registrar(
        "preferencia_usuario",
        `INSERT INTO preferencia_usuario (usuario_id)
         VALUES ($1)
         ON CONFLICT (usuario_id) DO NOTHING`,
        [usuario.id],
      );
    }

    for (const categoria of CATEGORIAS_FARMACOLOGICAS) {
      await registrar(
        "categoria_farmacologica",
        `INSERT INTO categoria_farmacologica (id, nome)
         VALUES ($1, $2)
         ON CONFLICT (id) DO NOTHING`,
        [categoria.id, categoria.nome],
      );
    }
    for (const medicamento of MEDICAMENTOS) {
      await registrar(
        "medicamento",
        `INSERT INTO medicamento (id, nome, categoria_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (id) DO NOTHING`,
        [medicamento.id, medicamento.nome, medicamento.categoriaId],
      );
    }

    for (const baia of BAIAS) {
      await registrar(
        "baia",
        `INSERT INTO baia (id, nome, tipo_baia_id, capacidade)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO NOTHING`,
        [baia.id, baia.nome, tipoBaiaIdPorCodigo[baia.tipoBaiaCodigo], baia.capacidade],
      );
    }

    for (const animal of ANIMAIS) {
      await registrar(
        "animal",
        `INSERT INTO animal (
           id, nome, especie_id, sexo, raca, coloracao, pelagem, porte, peso_kg,
           idade_aprox, microchip, esterilizado, status_id, motivo_entrada_id,
           data_entrada, baia_id, ficha_completa, observacoes, criado_por_id
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
         ON CONFLICT (id) DO NOTHING`,
        [
          animal.id,
          animal.nome,
          especieIdPorCodigo[animal.especieCodigo],
          animal.sexo,
          animal.raca,
          animal.coloracao,
          animal.pelagem,
          animal.porte,
          animal.pesoKg,
          animal.idadeAprox,
          animal.microchip,
          animal.esterilizado,
          statusAnimalIdPorCodigo[animal.statusCodigo],
          motivoEntradaIdPorCodigo[animal.motivoEntradaCodigo],
          dataPassada(animal.diasDesdeEntrada),
          animal.baiaId,
          animal.fichaCompleta,
          animal.observacoes,
          animal.criadoPorId,
        ],
      );
    }

    for (const vacinacao of VACINACOES) {
      await registrar(
        "vacinacao",
        `INSERT INTO vacinacao (
           id, animal_id, vacina_id, aplicado_por_id, data_aplicacao,
           numero_dose, dose_quantidade, dose_unidade, lote, retifica_id
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO NOTHING`,
        [
          vacinacao.id,
          vacinacao.animalId,
          vacinaIdPorCodigo[vacinacao.vacinaCodigo],
          vacinacao.aplicadoPorId,
          dataPassada(vacinacao.diasDesdeAplicacao),
          vacinacao.numeroDose,
          vacinacao.doseQuantidade,
          vacinacao.doseUnidade,
          vacinacao.lote,
          vacinacao.retificaId,
        ],
      );
    }

    for (const procedimento of PROCEDIMENTOS) {
      await registrar(
        "procedimento",
        `INSERT INTO procedimento (
           id, animal_id, tipo_procedimento_id, executado_por_id, data,
           descricao, resultado, retifica_id
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO NOTHING`,
        [
          procedimento.id,
          procedimento.animalId,
          tipoProcedimentoIdPorCodigo[procedimento.tipoProcedimentoCodigo],
          procedimento.executadoPorId,
          dataPassada(procedimento.diasDesde),
          procedimento.descricao,
          procedimento.resultado,
          procedimento.retificaId,
        ],
      );
    }

    for (const prescricao of PRESCRICOES) {
      await registrar(
        "prescricao",
        `INSERT INTO prescricao (
           id, animal_id, prescrito_por_id, medicamento_id, data_inicio,
           frequencia_aplicada, unidade_frequencia, dose_quantidade,
           dose_unidade, via_administracao, status, retifica_id
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (id) DO NOTHING`,
        [
          prescricao.id,
          prescricao.animalId,
          prescricao.prescritoPorId,
          prescricao.medicamentoId,
          dataPassada(prescricao.diasDesdeInicio),
          prescricao.frequenciaAplicada,
          prescricao.unidadeFrequencia,
          prescricao.doseQuantidade,
          prescricao.doseUnidade,
          prescricao.viaAdministracao,
          prescricao.status,
          prescricao.retificaId,
        ],
      );
    }

    let indiceAuditoria = 1;
    for (const usuario of USUARIOS) {
      await registrar(
        "auditoria_evento",
        `INSERT INTO auditoria_evento (id, usuario_id, acao, entidade)
         VALUES ($1, $2, 'LOGIN', 'usuario')
         ON CONFLICT (id) DO NOTHING`,
        [id("80000000", indiceAuditoria++), usuario.id],
      );
    }
    for (const animal of ANIMAIS.slice(0, 5)) {
      await registrar(
        "auditoria_evento",
        `INSERT INTO auditoria_evento (id, usuario_id, acao, entidade, payload_depois)
         VALUES ($1, $2, 'CRIACAO', 'animal', $3)
         ON CONFLICT (id) DO NOTHING`,
        [id("80000000", indiceAuditoria++), animal.criadoPorId, JSON.stringify({ nome: animal.nome })],
      );
    }

    await client.query("COMMIT");
  } catch (erro) {
    await client.query("ROLLBACK").catch(() => {});
    throw erro;
  } finally {
    await client.end();
  }

  console.log("Seed concluído. Linhas inseridas por tabela (0 = já existia):");
  for (const [tabela, quantidade] of Object.entries(contagens)) {
    console.log(`  ${tabela}: ${quantidade}`);
  }
  console.log("\nUsuários de teste (mesma senha para todos):");
  console.log(`  Senha: ${SENHA_TESTE}`);
  for (const usuario of USUARIOS) {
    console.log(`  - ${usuario.email}`);
  }
}

seed().catch((erro) => {
  console.error("Falha ao rodar o seed:", erro.message);
  process.exitCode = 1;
});
