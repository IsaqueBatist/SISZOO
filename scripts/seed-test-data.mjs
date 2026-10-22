// Popula o Postgres do docker-compose com um cenário realista de CCZ para uso
// manual (login, dashboard, listagens, relatórios). Idempotente: nunca faz
// UPDATE/DELETE, só insere o que ainda não existe (mesma técnica de
// V3__seed_cargos.sql: UUIDs fixos + ON CONFLICT DO NOTHING).
//
// Escopo: usuários/cargos, animais, clínico (vacinação/procedimento/
// prescrição), ocorrências (com denunciante/denunciado/movimentação) e
// processos sanitários (com amostras, responsável e resultado laboratorial).
// Não inclui relatório_gerado: esses registros nascem de uma exportação real
// (PDF/CSV), não fazem sentido como fixture.
//
// Determinístico: todas as escolhas "aleatórias" usam um gerador com seed
// fixa (mulberry32), então rodar de novo sempre produz o mesmo cenário —
// importante pra idempotência (IDs fixos) e pra qualquer print/vídeo de
// demonstração não mudar a cada execução.
//
// Pré-requisito: Postgres do docker-compose no ar e migrations Flyway já
// aplicadas (suba o backend uma vez: `docker compose up` ou
// `mvn spring-boot:run`).

import "dotenv/config";
import bcrypt from "bcryptjs";
import pg from "pg";

const SENHA_TESTE = "Teste@123";
const ANO_ATUAL = new Date().getFullYear();

const CARGO = {
  ADMINISTRADOR: "00000000-0000-4000-8000-000000000001",
  VETERINARIO: "00000000-0000-4000-8000-000000000002",
  AGENTE_SANITARIO: "00000000-0000-4000-8000-000000000003",
};

function id(grupo, indice) {
  return `${grupo}-0000-4000-8000-${String(indice).padStart(12, "0")}`;
}

// ── Gerador determinístico (mulberry32) ──────────────────────────────────
// Dados "realistas" pedem distribuição natural (idades variadas, datas
// espalhadas, status mais comuns que outros) — o padrão antigo (`i % X`)
// produzia ciclos óbvios demais pra parecer um CCZ de verdade. Seed fixa
// mantém o script idempotente e reproduzível.
function mulberry32(seed) {
  let a = seed;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(20260101);

function randInt(min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}
function pick(lista) {
  return lista[randInt(0, lista.length - 1)];
}
function pickVarios(lista, quantidade) {
  const copia = [...lista];
  const escolhidos = [];
  for (let i = 0; i < quantidade && copia.length > 0; i++) {
    escolhidos.push(copia.splice(randInt(0, copia.length - 1), 1)[0]);
  }
  return escolhidos;
}
function chance(probabilidade) {
  return rng() < probabilidade;
}
// Sorteio ponderado: [[valor, peso], ...] — pesos não precisam somar 1.
function pickPonderado(paresValorPeso) {
  const total = paresValorPeso.reduce((soma, [, peso]) => soma + peso, 0);
  let alvo = rng() * total;
  for (const [valor, peso] of paresValorPeso) {
    alvo -= peso;
    if (alvo <= 0) return valor;
  }
  return paresValorPeso[paresValorPeso.length - 1][0];
}

function dataPassada(dias) {
  const data = new Date();
  data.setDate(data.getDate() - dias);
  return data;
}
function dataFutura(dias) {
  return dataPassada(-dias);
}

// ── Catálogo de nomes e textos reutilizados ──────────────────────────────

// Atenção: o e-mail institucional é validado pela regex crítica
// `^[a-z.]+@itu\.sp\.gov\.br$` (só letras minúsculas e ponto — sem dígitos,
// sem underscore). Usar nomes por extenso em vez de sufixo numérico.
const USUARIOS = [
  { id: id("10000000", 1), email: "ana.admin.teste@itu.sp.gov.br", nome: "Ana", sobrenome: "Administradora", cargoId: CARGO.ADMINISTRADOR },
  { id: id("10000000", 2), email: "bruno.veterinario.teste@itu.sp.gov.br", nome: "Bruno", sobrenome: "Veterinário", cargoId: CARGO.VETERINARIO, crmv: "SP-12345" },
  { id: id("10000000", 3), email: "carla.veterinaria.teste@itu.sp.gov.br", nome: "Carla", sobrenome: "Veterinária", cargoId: CARGO.VETERINARIO, crmv: "SP-54321" },
  { id: id("10000000", 4), email: "diego.agente.teste@itu.sp.gov.br", nome: "Diego", sobrenome: "Agente", cargoId: CARGO.AGENTE_SANITARIO },
  { id: id("10000000", 5), email: "elis.agente.teste@itu.sp.gov.br", nome: "Elis", sobrenome: "Agente", cargoId: CARGO.AGENTE_SANITARIO },
  { id: id("10000000", 6), email: "fabio.veterinario.teste@itu.sp.gov.br", nome: "Fábio", sobrenome: "Veterinário", cargoId: CARGO.VETERINARIO, crmv: "SP-67890" },
  { id: id("10000000", 7), email: "gabriela.agente.teste@itu.sp.gov.br", nome: "Gabriela", sobrenome: "Agente", cargoId: CARGO.AGENTE_SANITARIO },
];
const VETERINARIOS = USUARIOS.filter((u) => u.cargoId === CARGO.VETERINARIO);
const AGENTES = USUARIOS.filter((u) => u.cargoId === CARGO.AGENTE_SANITARIO);
const CLINICOS = [...VETERINARIOS]; // quem aplica vacina/procedimento/prescrição

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

// Capacidades variadas de propósito: 2 baias ficam deliberadamente acima da
// capacidade (baia_superlotada no dashboard, T38) — o resto fica numa faixa
// saudável de ocupação.
// Capacidade total das baias "normais" (todas menos as 2 de demonstração)
// fica bem acima da demanda esperada (~55-65 animais sob custódia pra 100
// animais totais): sobra vaga de verdade na maioria, só as 2 marcadas
// ficam cheias de propósito.
const BAIAS = [
  { id: id("30000000", 1), nome: "Baia 01", tipoBaiaCodigo: "interna", capacidade: 3 },
  { id: id("30000000", 2), nome: "Baia 02", tipoBaiaCodigo: "interna", capacidade: 7 },
  { id: id("30000000", 3), nome: "Baia 03", tipoBaiaCodigo: "interna", capacidade: 6 },
  { id: id("30000000", 4), nome: "Baia 04", tipoBaiaCodigo: "gatil", capacidade: 9 },
  { id: id("30000000", 5), nome: "Baia 05", tipoBaiaCodigo: "gatil", capacidade: 8 },
  { id: id("30000000", 6), nome: "Baia 06", tipoBaiaCodigo: "gatil", capacidade: 3 },
  { id: id("30000000", 7), nome: "Baia 07", tipoBaiaCodigo: "externa", capacidade: 12 },
  { id: id("30000000", 8), nome: "Baia 08", tipoBaiaCodigo: "externa", capacidade: 9 },
  { id: id("30000000", 9), nome: "Baia 09", tipoBaiaCodigo: "interna", capacidade: 7 },
  { id: id("30000000", 10), nome: "Baia 10", tipoBaiaCodigo: "gatil", capacidade: 6 },
];
const BAIAS_SUPERLOTADAS_PROPOSITAL = new Set([BAIAS[0].id, BAIAS[5].id]); // Baia 01 e 06

const MOTIVOS_ENTRADA = ["recolhimento", "abandono", "entrega_voluntaria", "resgate", "apreensao_judicial"];
const SEXOS = ["macho", "femea", "nao_identificado"];
const PELAGENS = ["curta", "longa"];
const PORTES = ["pequeno", "medio", "grande"];
const RACAS_CANINAS = ["SRD", "Labrador", "Poodle", "Pastor Alemão", "Pit Bull", "Vira-lata Caramelo"];
const RACAS_FELINAS = ["SRD", "Siamês", "Persa", "Maine Coon"];
const COLORACOES = ["Preto", "Branco", "Caramelo", "Cinza", "Malhado", "Tricolor", "Rajado"];
const NOMES_ANIMAIS = [
  "Rex", "Bela", "Thor", "Mel", "Simba", "Luna", "Bob", "Nina", "Max", "Lola",
  "Toby", "Amora", "Bidu", "Mimi", "Fred", "Duda", "Zeus", "Pipoca", "Bento", "Nala",
  "Apolo", "Gaia", "Rocky", "Pandora", "Bolt", "Sasha", "Frajola", "Pingo", "Chico", "Estrela",
  "Fuba", "Caramelo", "Mia", "Bibi", "Leo", "Nino", "Flor", "Jujuba", "Odin", "Lili",
  "Pretinho", "Branquinha", "Tom", "Mingau", "Belinha", "Spike", "Docinho", "Trovão", "Perola", "Juba",
  "Pantera", "Guto", "Kiara", "Hulk", "Pandinha", "Trufa", "Valente", "Marrom", "Saci", "Ventania",
];

// Pesos refletem um CCZ real: cães e gatos dominam, morcego/PNH são minoria
// (amostragem de campo, não população residente). Status concentra em quem
// está sob cuidado ativo — a maioria do fluxo real não fica "em trânsito"
// indefinidamente.
const ESPECIE_PESOS = [["canino", 55], ["felino", 35], ["quiroptero", 6], ["pnh", 4]];
const STATUS_ANIMAL_PESOS = [
  ["disponivel_adocao", 28], ["em_tratamento", 14], ["em_quarentena", 8],
  ["adotado", 22], ["obito_natural", 6], ["obito_eutanasia", 4], ["transferido", 8],
];
const STATUS_COM_BAIA = new Set(["disponivel_adocao", "em_tratamento", "em_quarentena"]);

const TOTAL_ANIMAIS = 100;
const ANIMAIS = [];
for (let i = 0; i < TOTAL_ANIMAIS; i++) {
  const indice = i + 1;
  const especieCodigo = pickPonderado(ESPECIE_PESOS);
  const statusCodigo = pickPonderado(STATUS_ANIMAL_PESOS);
  const isDomestico = especieCodigo === "canino" || especieCodigo === "felino";
  const sobCustodia = STATUS_COM_BAIA.has(statusCodigo);
  const microchip = chance(0.6);
  const diasDesdeEntrada = randInt(3, 540); // até ~18 meses de histórico
  ANIMAIS.push({
    id: id("40000000", indice),
    nome: NOMES_ANIMAIS[i % NOMES_ANIMAIS.length] + (i >= NOMES_ANIMAIS.length ? ` ${Math.floor(i / NOMES_ANIMAIS.length) + 1}` : ""),
    especieCodigo,
    sexo: pick(SEXOS),
    raca: isDomestico ? pick(especieCodigo === "canino" ? RACAS_CANINAS : RACAS_FELINAS) : null,
    coloracao: pick(COLORACOES),
    pelagem: isDomestico ? pick(PELAGENS) : null,
    porte: pick(PORTES),
    pesoKg: (especieCodigo === "felino" ? randInt(25, 55) : randInt(15, 400) / 10).toFixed(2),
    idadeAprox: chance(0.55) ? `${randInt(1, 10)} anos` : `${randInt(2, 11)} meses`,
    microchip: microchip ? `900000000${String(indice).padStart(5, "0")}` : null,
    esterilizado: chance(0.4),
    statusCodigo,
    sobCustodia,
    motivoEntradaCodigo: pick(MOTIVOS_ENTRADA),
    diasDesdeEntrada,
    baiaId: null, // atribuído abaixo, depois de conhecer a demanda total
    observacoes: null,
    criadoPorId: pick(AGENTES).id,
  });
}
const ANIMAIS_SOB_CUSTODIA = ANIMAIS.filter((a) => a.sobCustodia);

// Distribuição de baia em 2 passos, feita depois de gerar todos os animais
// (preciso saber a demanda total antes de decidir quem fica em qual baia):
// 1) as 2 baias de demonstração recebem um pouco além da própria
//    capacidade (baia_superlotada no dashboard, T38);
// 2) o resto vai pras baias normais por "menor ocupação relativa primeiro"
//    (bin-packing simples) — nenhuma delas passa da capacidade; quem não
//    coube fica sem baia (fila de espera real do CCZ, não é bug).
{
  const CAPACIDADE_EXTRA_SUPERLOTACAO = 2;
  const ocupacaoPorBaia = new Map(BAIAS.map((b) => [b.id, 0]));
  const filaDeAnimais = [...ANIMAIS_SOB_CUSTODIA];

  for (const baiaId of BAIAS_SUPERLOTADAS_PROPOSITAL) {
    const baia = BAIAS.find((b) => b.id === baiaId);
    const alvo = baia.capacidade + CAPACIDADE_EXTRA_SUPERLOTACAO;
    for (let i = 0; i < alvo && filaDeAnimais.length > 0; i++) {
      const animal = filaDeAnimais.shift();
      animal.baiaId = baiaId;
      ocupacaoPorBaia.set(baiaId, ocupacaoPorBaia.get(baiaId) + 1);
    }
  }

  const baiasNormais = BAIAS.filter((b) => !BAIAS_SUPERLOTADAS_PROPOSITAL.has(b.id));
  for (const animal of filaDeAnimais) {
    const candidatas = baiasNormais.filter((b) => ocupacaoPorBaia.get(b.id) < b.capacidade);
    if (candidatas.length === 0) continue; // sem vaga sobrando: fica sem baia
    candidatas.sort(
      (a, b) => ocupacaoPorBaia.get(a.id) / a.capacidade - ocupacaoPorBaia.get(b.id) / b.capacidade,
    );
    const escolhida = candidatas[0];
    animal.baiaId = escolhida.id;
    ocupacaoPorBaia.set(escolhida.id, ocupacaoPorBaia.get(escolhida.id) + 1);
  }
}

// ── Vacinações ────────────────────────────────────────────────────────────
// Todas as vacinas do catálogo têm intervalo de 12 meses (V5). Fração dos
// animais sob custódia recebe vacinação; dentro desses, a maioria fica "em
// dia" (aplicação recente), uma fatia menor cai nas janelas de alerta
// (vencendo em até 7 dias / já vencida) — o suficiente pra popular os
// alertas do dashboard (T38) sem virar maioria.
const VACINAS_CODIGOS = ["antirrabica", "v10", "v8", "v4_felinos", "giardia", "gripe_canina", "felv", "leishmaniose"];
const VACINACOES = [];
{
  let proximoIndice = 1;
  for (const animal of ANIMAIS_SOB_CUSTODIA) {
    if (!chance(0.8)) continue; // ~20% sem nenhuma vacinação (ficha incompleta / "sem vacina em dia")
    const quantas = randInt(1, 3);
    const vacinasJaAplicadas = pickVarios(VACINAS_CODIGOS, quantas);
    for (let v = 0; v < vacinasJaAplicadas.length; v++) {
      // diasDesdeAplicacao = quantos dias atrás a dose foi aplicada.
      // dataValidade = dataAplicacao + 12 meses (365d); escolhendo o valor
      // certo aqui controla direto em qual faixa do alerta a vacina cai.
      const faixa = pickPonderado([
        ["em_dia", 70], // validade bem no futuro
        ["vencendo_em_breve", 12], // validade entre hoje e hoje+7d
        ["vencida", 8], // validade já passou
        ["vencida_ha_muito", 10], // validade passou há bastante tempo
      ]);
      let diasDesdeAplicacao;
      if (faixa === "em_dia") diasDesdeAplicacao = randInt(5, 330);
      else if (faixa === "vencendo_em_breve") diasDesdeAplicacao = 365 - randInt(0, 7);
      else if (faixa === "vencida") diasDesdeAplicacao = 365 + randInt(1, 25);
      else diasDesdeAplicacao = 365 + randInt(60, 300);

      VACINACOES.push({
        id: id("50000000", proximoIndice++),
        animalId: animal.id,
        vacinaCodigo: vacinasJaAplicadas[v],
        aplicadoPorId: pick(CLINICOS).id,
        diasDesdeAplicacao,
        numeroDose: randInt(1, 2),
        doseQuantidade: "1.000",
        doseUnidade: "MILILITRO",
        lote: `LT${String(proximoIndice).padStart(4, "0")}`,
        retificaId: null,
      });
    }
  }
  // Exemplo de retificação (corrige o lote sem alterar a linha original).
  const original = VACINACOES[0];
  VACINACOES.push({
    id: id("50000000", proximoIndice++),
    animalId: original.animalId,
    vacinaCodigo: original.vacinaCodigo,
    aplicadoPorId: original.aplicadoPorId,
    diasDesdeAplicacao: original.diasDesdeAplicacao,
    numeroDose: original.numeroDose,
    doseQuantidade: original.doseQuantidade,
    doseUnidade: original.doseUnidade,
    lote: "LT0001-CORRIGIDO",
    retificaId: original.id,
  });
}
// ficha_completa (DER §3.2): microchip presente E ao menos uma vacinação —
// calculado aqui, depois de gerar as vacinações, pro dado bater com a regra
// real (FichaCompletaService), em vez de um flag solto e inconsistente.
const ANIMAIS_COM_VACINACAO = new Set(VACINACOES.map((v) => v.animalId));
for (const animal of ANIMAIS) {
  animal.fichaCompleta = Boolean(animal.microchip) && ANIMAIS_COM_VACINACAO.has(animal.id);
}

// ── Procedimentos ──────────────────────────────────────────────────────────
// A maioria dos animais sob custódia tem avaliação recente; uma minoria
// deliberada fica sem nenhuma nos últimos 30 dias (alerta sem_avaliacao_30d).
const TIPOS_PROCEDIMENTO_CODIGOS = ["atendimento_clinico", "castracao", "cirurgia_maior", "vacinacao"];
const DESCRICOES_PROCEDIMENTO = [
  "Avaliação clínica de rotina, sem alterações.",
  "Atendimento por queixa de apatia, resolvido com observação.",
  "Procedimento cirúrgico sem intercorrências.",
  "Reavaliação pós-tratamento, evolução favorável.",
];
const PROCEDIMENTOS = [];
{
  let proximoIndice = 1;
  for (const animal of ANIMAIS_SOB_CUSTODIA) {
    if (!chance(0.82)) continue; // ~18% sem procedimento recente, de propósito
    const quantos = randInt(1, 3);
    for (let p = 0; p < quantos; p++) {
      const recente = p === quantos - 1; // o último/mais recente decide se "está em dia"
      const diasDesde = recente ? randInt(0, 29) : randInt(30, 300);
      PROCEDIMENTOS.push({
        id: id("60000000", proximoIndice++),
        animalId: animal.id,
        tipoProcedimentoCodigo: pick(TIPOS_PROCEDIMENTO_CODIGOS),
        executadoPorId: pick(CLINICOS).id,
        diasDesde,
        descricao: pick(DESCRICOES_PROCEDIMENTO),
        resultado: "Sem alterações significativas.",
        retificaId: null,
      });
    }
  }
  const original = PROCEDIMENTOS[0];
  PROCEDIMENTOS.push({
    id: id("60000000", proximoIndice++),
    animalId: original.animalId,
    tipoProcedimentoCodigo: original.tipoProcedimentoCodigo,
    executadoPorId: original.executadoPorId,
    diasDesde: original.diasDesde,
    descricao: original.descricao,
    resultado: "Resultado corrigido: leve alteração observada em reavaliação.",
    retificaId: original.id,
  });
}

// ── Prescrições ────────────────────────────────────────────────────────────
// Algumas ATIVAS terminando nos próximos 7 dias (alerta medicacao_ativa,
// T38); o resto espalhado entre ativa de longo prazo, concluída, suspensa e
// cancelada.
const UNIDADES_FREQUENCIA = ["HORAS", "DIAS"];
const VIAS_ADMINISTRACAO = ["ORAL", "INTRAVENOSA", "INTRAMUSCULAR", "SUBCUTANEA", "TOPICA"];
const PRESCRICOES = [];
{
  let proximoIndice = 1;
  const candidatos = pickVarios(ANIMAIS_SOB_CUSTODIA, Math.min(50, ANIMAIS_SOB_CUSTODIA.length));
  for (const animal of candidatos) {
    const statusEscolhido = pickPonderado([
      ["ATIVA_TERMINANDO", 15], ["ATIVA_LONGO_PRAZO", 20],
      ["CONCLUIDA", 35], ["SUSPENSA", 10], ["CANCELADA", 10],
    ]);
    let status = "ATIVA";
    let diasDesdeInicio;
    let diasAteFim; // positivo = no futuro, negativo = já passou
    if (statusEscolhido === "ATIVA_TERMINANDO") {
      diasDesdeInicio = randInt(1, 5);
      diasAteFim = randInt(0, 7);
    } else if (statusEscolhido === "ATIVA_LONGO_PRAZO") {
      diasDesdeInicio = randInt(1, 10);
      diasAteFim = randInt(8, 30);
    } else {
      status = statusEscolhido;
      diasDesdeInicio = randInt(10, 90);
      diasAteFim = -randInt(1, 60);
    }
    PRESCRICOES.push({
      id: id("70000000", proximoIndice++),
      animalId: animal.id,
      medicamentoId: pick(MEDICAMENTOS).id,
      prescritoPorId: pick(CLINICOS).id,
      diasDesdeInicio,
      diasAteFim,
      frequenciaAplicada: pick([1, 2, 3, 8, 12, 24]),
      unidadeFrequencia: pick(UNIDADES_FREQUENCIA),
      doseQuantidade: "10.000",
      doseUnidade: "MILIGRAMA",
      viaAdministracao: pick(VIAS_ADMINISTRACAO),
      status,
      retificaId: null,
    });
  }
  const original = PRESCRICOES[0];
  PRESCRICOES.push({
    id: id("70000000", proximoIndice++),
    animalId: original.animalId,
    medicamentoId: original.medicamentoId,
    prescritoPorId: original.prescritoPorId,
    diasDesdeInicio: original.diasDesdeInicio,
    diasAteFim: original.diasAteFim,
    frequenciaAplicada: original.frequenciaAplicada,
    unidadeFrequencia: original.unidadeFrequencia,
    doseQuantidade: original.doseQuantidade,
    doseUnidade: original.doseUnidade,
    viaAdministracao: original.viaAdministracao,
    status: "CANCELADA",
    retificaId: original.id,
  });
}

// ── Ocorrências ────────────────────────────────────────────────────────────
const PROVIDENCIAS_CODIGOS_SEM_PROCESSO = ["orientacao_municipe", "encaminhamento_gepar", "captura_remocao", "sem_acao", "outro"];
const BAIRROS = [
  "Centro", "Jardim Petrópolis", "Vila Padre Bento", "Parque Industrial", "Jardim Pau Preto",
  "Vila Nova", "Jardim São Vicente", "Cidade Nova", "Jardim das Nações", "Vila Nazaré",
  "Jardim Alvorada", "Parque São Lourenço",
];
const LOGRADOUROS = ["Rua das Flores", "Avenida Brasil", "Rua XV de Novembro", "Rua Sete de Setembro", "Alameda dos Ipês", "Rua Dom Pedro I"];
const NOMES_PESSOAS = [
  "José da Silva", "Maria Oliveira", "João Pereira", "Ana Souza", "Carlos Santos", "Fernanda Lima",
  "Paulo Costa", "Juliana Alves", "Marcos Ferreira", "Patrícia Gomes", "Ricardo Rodrigues", "Camila Martins",
  "Eduardo Barbosa", "Luciana Carvalho", "Rodrigo Nascimento", "Vanessa Araújo", "Sérgio Ribeiro", "Débora Pinto",
];
function enderecoAleatorio() {
  return `${pick(LOGRADOUROS)}, ${randInt(10, 2500)}`;
}
function cpfFicticio() {
  return `${randInt(100, 999)}.${randInt(100, 999)}.${randInt(100, 999)}-${randInt(10, 99)}`;
}
function telefoneFicticio() {
  return `(11) 9${randInt(1000, 9999)}-${randInt(1000, 9999)}`;
}

const TOTAL_OCORRENCIAS = 55;
const OCORRENCIAS = [];
{
  for (let i = 1; i <= TOTAL_OCORRENCIAS; i++) {
    // As últimas 4 ocorrências nascem "hoje" — garante volume em
    // kpis.ocorrencias.registradasHoje (T38) sem exigir rodar o seed no
    // exato instante de uma demonstração.
    const diasDesdeAbertura = i > TOTAL_OCORRENCIAS - 4 ? 0 : randInt(1, 365);
    const tipoOcorrenciaCodigo = pickPonderado([
      ["zoonose", 30], ["agressivo", 25], ["morcegos", 15], ["irregular", 15], ["outros", 15],
    ]);
    const anonima = chance(0.12);
    const sigilosa = !anonima && chance(0.18);
    const statusOcorrencia = pickPonderado([["ABERTA", 15], ["EM_ATENDIMENTO", 15], ["ENCERRADA", 70]]);
    // Zoonose/agressivo com contato humano tendem a virar processo sanitário
    // — mantém a proporção de "abertura_processo" coerente com o tipo.
    const tendeAProcesso = tipoOcorrenciaCodigo === "zoonose" || tipoOcorrenciaCodigo === "agressivo";
    const providenciaCodigo = statusOcorrencia === "ENCERRADA"
      ? pickPonderado([
          ["abertura_processo", tendeAProcesso ? 45 : 10],
          ["registro_indevido", 6],
          ...PROVIDENCIAS_CODIGOS_SEM_PROCESSO.map((c) => [c, 15]),
        ])
      : null;

    OCORRENCIAS.push({
      id: id("90000000", i),
      protocolo: null, // preenchido no momento de inserir, respeitando a sequência por ano
      tipoOcorrenciaCodigo,
      statusOcorrencia,
      diasDesdeAbertura,
      horaAbertura: `${String(randInt(7, 19)).padStart(2, "0")}:${pick(["00", "15", "30", "45"])}`,
      endereco: enderecoAleatorio(),
      bairro: pick(BAIRROS),
      pontoReferencia: chance(0.4) ? "Próximo à praça" : null,
      descricao: `Ocorrência do tipo ${tipoOcorrenciaCodigo} registrada para dados de teste.`,
      urgente: chance(0.15),
      sigilosa,
      anonima,
      registradoPorId: pick(AGENTES).id,
      providenciaCodigo,
      descricaoEncerramento: providenciaCodigo ? "Caso avaliado e encerrado conforme providência registrada." : null,
      encerradaPorId: providenciaCodigo ? pick(AGENTES).id : null,
      temDenunciante: !anonima && chance(0.85),
      temDenunciado: chance(0.5),
      nomeDenunciante: null,
      nomeDenunciado: null,
    });
  }
  for (const ocorrencia of OCORRENCIAS) {
    if (ocorrencia.temDenunciante) ocorrencia.nomeDenunciante = pick(NOMES_PESSOAS);
    if (ocorrencia.temDenunciado) ocorrencia.nomeDenunciado = pick(NOMES_PESSOAS);
  }
}
// Ocorrências que abrem processo sanitário (vínculo 1:0..1) — separadas pra
// a seção de processos saber quais já têm uma ocorrência de origem.
const OCORRENCIAS_COM_PROCESSO = OCORRENCIAS.filter((o) => o.providenciaCodigo === "abertura_processo");

// ── Processos sanitários ───────────────────────────────────────────────────
const DOENCA_PESOS = [
  ["raiva", 35], ["leptospirose", 20], ["leishmaniose_visceral", 15],
  ["esporotricose", 15], ["febre_maculosa", 10], ["febre_amarela", 5],
];
const LABORATORIOS_CODIGOS = ["pasteur_sp", "ial_sorocaba", "ccz_sp", "itu_ll01"];
const SINTOMAS_CODIGOS = [
  "apatia", "alt_comportamental", "descamacao", "ulcera_pele", "ceratoconjuntivite", "coriza",
  "emagrecimento", "diarreia", "salivacao_excessiva", "hemorragia_interna", "vomito", "aumento_linfonodo",
];
function especiePorDoenca(doencaCodigo) {
  // Raiva amostra sobretudo cães/gatos, com alguma fração de morcego/PNH
  // (os vetores silvestres clássicos de vigilância); as demais doenças
  // ficam concentradas em cães/gatos, mais próximo da realidade clínica.
  if (doencaCodigo === "raiva") return pickPonderado([["canino", 45], ["felino", 25], ["quiroptero", 20], ["pnh", 10]]);
  return pickPonderado([["canino", 60], ["felino", 38], ["quiroptero", 1], ["pnh", 1]]);
}

const TOTAL_PROCESSOS = 28;
const PROCESSOS = [];
const RESPONSAVEIS_PROCESSO = [];
const AMOSTRAS = [];
const AMOSTRA_SINTOMAS = [];
const RESULTADOS_PROCESSO = [];
{
  let indiceProcesso = 1;
  let indiceAmostra = 1;
  let indiceResultado = 1;
  const ocorrenciasDisponiveis = [...OCORRENCIAS_COM_PROCESSO];

  for (let i = 0; i < TOTAL_PROCESSOS; i++) {
    const doencaCodigo = pickPonderado(DOENCA_PESOS);
    // ~40% dos processos nascem vinculados a uma ocorrência já encerrada com
    // "abertura_processo" (D33); o resto é aberto direto (laboratório/
    // demanda espontânea), como já acontece na operação real.
    const ocorrenciaOrigem = chance(0.4) && ocorrenciasDisponiveis.length > 0
      ? ocorrenciasDisponiveis.pop()
      : null;
    const diasDesdeAbertura = ocorrenciaOrigem
      ? Math.max(0, ocorrenciaOrigem.diasDesdeAbertura - randInt(0, 3))
      : randInt(1, 300);

    const statusProcesso = pickPonderado([
      ["ABERTO", 18], ["AGUARDANDO_RESULTADO", 15], ["COM_RESULTADO", 47], ["CONCLUIDO", 20],
    ]);
    const temResultado = statusProcesso === "COM_RESULTADO" || statusProcesso === "CONCLUIDO";

    const processo = {
      id: id("A0000000", indiceProcesso),
      protocoloNumero: indiceProcesso, // vira "NNN/ANO" na hora de inserir
      doencaCodigo,
      laboratorioCodigo: pick(LABORATORIOS_CODIGOS),
      diasDesdeAbertura,
      ocorrenciaId: ocorrenciaOrigem ? ocorrenciaOrigem.id : null,
      statusProcesso,
      criadoPorId: pick([...CLINICOS, ...AGENTES]).id,
      urgente: false, // definido abaixo, a partir das amostras (DER regra 18)
      desfechoCodigo: statusProcesso === "CONCLUIDO" ? pickPonderado([
        ["em_acompanhamento", 55], ["obito_natural", 20], ["obito_eutanasia", 15], ["obito_outro", 10],
      ]) : null,
    };
    PROCESSOS.push(processo);

    RESPONSAVEIS_PROCESSO.push({
      id: id("A1000000", indiceProcesso),
      processoId: processo.id,
      nome: pick(NOMES_PESSOAS),
      cpf: cpfFicticio(),
      telefone: telefoneFicticio(),
      email: null,
      cep: null,
      endereco: enderecoAleatorio(),
      bairroResidencial: pick(BAIRROS),
      bairroOcorrencia: pick(BAIRROS),
    });

    const quantasAmostras = randInt(1, 2);
    const amostrasDoProcesso = [];
    for (let a = 0; a < quantasAmostras; a++) {
      const especieCodigo = especiePorDoenca(doencaCodigo);
      const usaAnimalDoCanil = chance(0.35) && ANIMAIS.some((an) => an.especieCodigo === especieCodigo);
      const animalReferencia = usaAnimalDoCanil
        ? pick(ANIMAIS.filter((an) => an.especieCodigo === especieCodigo))
        : null;
      const statusClinico = pickPonderado([["ASSINTOMATICO", 55], ["SINTOMATICO", 40], ["OBITO", 5]]);
      // Baixo de propósito: com 1-2 amostras por processo, qualquer uma com
      // contato humano já torna o processo inteiro urgente (DER regra 18) —
      // um valor alto aqui faria "processos urgentes" virar maioria, o que
      // não reflete a real operação de um CCZ.
      const contatoHumano = chance(0.15);
      const materialBiologico = doencaCodigo === "raiva" && statusClinico === "OBITO"
        ? "TECIDO_ENCEFALICO"
        : pick(["SORO", "SANGUE", "SALIVA", "URINA"]);

      const amostra = {
        id: id("A2000000", indiceAmostra),
        processoId: processo.id,
        animalId: animalReferencia ? animalReferencia.id : null,
        especieCodigo,
        sexo: animalReferencia ? animalReferencia.sexo : pick(SEXOS),
        raca: animalReferencia ? animalReferencia.raca : null,
        coloracao: animalReferencia ? animalReferencia.coloracao : pick(COLORACOES),
        pelagem: animalReferencia ? animalReferencia.pelagem : (especieCodigo === "canino" || especieCodigo === "felino" ? pick(PELAGENS) : null),
        idadeAprox: animalReferencia ? animalReferencia.idadeAprox : (chance(0.5) ? `${randInt(1, 8)} anos` : `${randInt(2, 11)} meses`),
        pesoKg: animalReferencia ? animalReferencia.pesoKg : (especieCodigo === "felino" ? (randInt(25, 55) / 10).toFixed(2) : (randInt(15, 400) / 10).toFixed(2)),
        statusClinico,
        tipoAbrigo: pickPonderado([["PERIDOMICILIAR", 40], ["INTRADOMICILIAR", 35], ["SILVESTRE", 15], ["NAO_IDENTIFICADO", 10]]),
        alteracaoComportamental: statusClinico === "SINTOMATICO" ? "Animal apresentou alteração de comportamento nos últimos dias." : null,
        diasDesdeColeta: Math.max(0, diasDesdeAbertura - randInt(0, 3)),
        materialBiologico,
        contatoHumano,
        nivelContato: contatoHumano ? pick(["DIRETA", "INDIRETA"]) : null,
        agrediuHumano: contatoHumano ? chance(0.3) : null,
        observacoes: null,
        sintomasCodigos: statusClinico === "SINTOMATICO" ? pickVarios(SINTOMAS_CODIGOS, randInt(1, 3)) : [],
      };
      amostrasDoProcesso.push(amostra);
      AMOSTRAS.push(amostra);
      for (const sintomaCodigo of amostra.sintomasCodigos) {
        AMOSTRA_SINTOMAS.push({ animalAmostradoId: amostra.id, sintomaCodigo });
      }
      indiceAmostra++;
    }
    processo.urgente = amostrasDoProcesso.some((a) => a.contatoHumano);

    if (temResultado) {
      const resultadoCodigo = pickPonderado([
        ["negativo", 55], ["positivo", 20], ["inconclusivo", 15], ["material_inadequado", 10],
      ]);
      const diasAteResultado = Math.max(0, diasDesdeAbertura - randInt(5, 20));
      const original = {
        id: id("A3000000", indiceResultado),
        processoId: processo.id,
        resultadoCodigo,
        diasDesde: diasAteResultado,
        observacoes: null,
        retificaId: null,
        registradoPorId: pick(CLINICOS).id,
      };
      RESULTADOS_PROCESSO.push(original);
      indiceResultado++;
      // ~15% dos resultados recebem uma retificação (corrige sem apagar o original).
      // Positivo é definitivo (V21, T35-16): o trigger recusa corrigi-lo. O
      // sorteio vem antes do teste pra não deslocar a sequência do gerador.
      if (chance(0.15) && resultadoCodigo !== "positivo") {
        const retificado = {
          id: id("A3000000", indiceResultado),
          processoId: processo.id,
          resultadoCodigo: resultadoCodigo === "inconclusivo" ? pick(["positivo", "negativo"]) : resultadoCodigo,
          diasDesde: Math.max(0, diasAteResultado - randInt(1, 5)),
          observacoes: "Retificação após reanálise laboratorial.",
          retificaId: original.id,
          registradoPorId: pick(CLINICOS).id,
        };
        RESULTADOS_PROCESSO.push(retificado);
        processo.resultadoVigente = retificado;
        indiceResultado++;
      } else {
        processo.resultadoVigente = original;
      }
    }
    indiceProcesso++;
  }
}

// ═══════════════════════════════════════════════════════════════════════
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

function protocoloDe(numero) {
  return `${String(numero).padStart(3, "0")}/${ANO_ATUAL}`;
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
    const tipoOcorrenciaIdPorCodigo = await mapaPorCodigo(client, "tipo_ocorrencia");
    const providenciaIdPorCodigo = await mapaPorCodigo(client, "providencia_tomada");
    const doencaIdPorCodigo = await mapaPorCodigo(client, "doenca");
    const laboratorioIdPorCodigo = await mapaPorCodigo(client, "laboratorio");
    const sintomaIdPorCodigo = await mapaPorCodigo(client, "sintoma");
    const resultadoLaboratorialIdPorCodigo = await mapaPorCodigo(client, "resultado_laboratorial");
    const desfechoAnimalIdPorCodigo = await mapaPorCodigo(client, "desfecho_animal");

    // ── Usuários ──
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
        `INSERT INTO usuario_cargo (usuario_id, cargo_id) VALUES ($1, $2) ON CONFLICT (usuario_id, cargo_id) DO NOTHING`,
        [usuario.id, usuario.cargoId],
      );
      await registrar(
        "preferencia_usuario",
        `INSERT INTO preferencia_usuario (usuario_id) VALUES ($1) ON CONFLICT (usuario_id) DO NOTHING`,
        [usuario.id],
      );
    }

    // ── Clínico: catálogos próprios ──
    for (const categoria of CATEGORIAS_FARMACOLOGICAS) {
      await registrar(
        "categoria_farmacologica",
        `INSERT INTO categoria_farmacologica (id, nome) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`,
        [categoria.id, categoria.nome],
      );
    }
    for (const medicamento of MEDICAMENTOS) {
      await registrar(
        "medicamento",
        `INSERT INTO medicamento (id, nome, categoria_id) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`,
        [medicamento.id, medicamento.nome, medicamento.categoriaId],
      );
    }

    // ── Baias ──
    for (const baia of BAIAS) {
      await registrar(
        "baia",
        `INSERT INTO baia (id, nome, tipo_baia_id, capacidade) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING`,
        [baia.id, baia.nome, tipoBaiaIdPorCodigo[baia.tipoBaiaCodigo], baia.capacidade],
      );
    }

    // ── Animais ──
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
          animal.id, animal.nome, especieIdPorCodigo[animal.especieCodigo], animal.sexo, animal.raca,
          animal.coloracao, animal.pelagem, animal.porte, animal.pesoKg, animal.idadeAprox, animal.microchip,
          animal.esterilizado, statusAnimalIdPorCodigo[animal.statusCodigo], motivoEntradaIdPorCodigo[animal.motivoEntradaCodigo],
          dataPassada(animal.diasDesdeEntrada), animal.baiaId, animal.fichaCompleta, animal.observacoes, animal.criadoPorId,
        ],
      );
    }

    // ── Clínico: registros ──
    // Tabelas com retificação usam ON CONFLICT sem alvo: além do id, há o
    // UNIQUE de retifica_id. Se o cenário gerado mudar entre execuções (mais
    // animais, outra ordem de sorteio), a linha de retificação ganha outro id
    // mas aponta pro mesmo original — com ON CONFLICT (id) isso abortava o
    // seed com violação de uq_<tabela>_retifica_id.
    for (const vacinacao of VACINACOES) {
      await registrar(
        "vacinacao",
        `INSERT INTO vacinacao (
           id, animal_id, vacina_id, aplicado_por_id, data_aplicacao,
           numero_dose, dose_quantidade, dose_unidade, lote, retifica_id
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT DO NOTHING`,
        [
          vacinacao.id, vacinacao.animalId, vacinaIdPorCodigo[vacinacao.vacinaCodigo], vacinacao.aplicadoPorId,
          dataPassada(vacinacao.diasDesdeAplicacao), vacinacao.numeroDose, vacinacao.doseQuantidade,
          vacinacao.doseUnidade, vacinacao.lote, vacinacao.retificaId,
        ],
      );
    }
    for (const procedimento of PROCEDIMENTOS) {
      await registrar(
        "procedimento",
        `INSERT INTO procedimento (
           id, animal_id, tipo_procedimento_id, executado_por_id, data, descricao, resultado, retifica_id
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT DO NOTHING`,
        [
          procedimento.id, procedimento.animalId, tipoProcedimentoIdPorCodigo[procedimento.tipoProcedimentoCodigo],
          procedimento.executadoPorId, dataPassada(procedimento.diasDesde), procedimento.descricao,
          procedimento.resultado, procedimento.retificaId,
        ],
      );
    }
    for (const prescricao of PRESCRICOES) {
      await registrar(
        "prescricao",
        `INSERT INTO prescricao (
           id, animal_id, prescrito_por_id, medicamento_id, data_inicio,
           data_fim_prevista, frequencia_aplicada, unidade_frequencia, dose_quantidade,
           dose_unidade, via_administracao, status, retifica_id
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) ON CONFLICT DO NOTHING`,
        [
          prescricao.id, prescricao.animalId, prescricao.prescritoPorId, prescricao.medicamentoId,
          dataPassada(prescricao.diasDesdeInicio), dataFutura(prescricao.diasAteFim),
          prescricao.frequenciaAplicada, prescricao.unidadeFrequencia, prescricao.doseQuantidade,
          prescricao.doseUnidade, prescricao.viaAdministracao, prescricao.status, prescricao.retificaId,
        ],
      );
    }

    // ── Ocorrências ──
    // Protocolo = posição no array (1..N) formatada "NNN/ANO" — mesma lógica
    // sequencial do ProtocoloService. protocolo_sequencia é alimentado no
    // fim desta função, pra app continuar a numeração sem colidir.
    OCORRENCIAS.forEach((o, indice) => { o.protocolo = protocoloDe(indice + 1); });

    for (const ocorrencia of OCORRENCIAS) {
      await registrar(
        "ocorrencia",
        `INSERT INTO ocorrencia (
           id, protocolo, tipo_ocorrencia_id, status_ocorrencia, data_abertura, hora_abertura,
           endereco, bairro, ponto_referencia, descricao, urgente, sigilosa, anonima,
           registrado_por_id, providencia_tomada_id, descricao_encerramento, encerrada_em, encerrada_por_id
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
         ON CONFLICT (id) DO NOTHING`,
        [
          ocorrencia.id, ocorrencia.protocolo, tipoOcorrenciaIdPorCodigo[ocorrencia.tipoOcorrenciaCodigo],
          ocorrencia.statusOcorrencia, dataPassada(ocorrencia.diasDesdeAbertura), ocorrencia.horaAbertura,
          ocorrencia.endereco, ocorrencia.bairro, ocorrencia.pontoReferencia, ocorrencia.descricao,
          ocorrencia.urgente, ocorrencia.sigilosa, ocorrencia.anonima, ocorrencia.registradoPorId,
          ocorrencia.providenciaCodigo ? providenciaIdPorCodigo[ocorrencia.providenciaCodigo] : null,
          ocorrencia.descricaoEncerramento,
          ocorrencia.statusOcorrencia === "ENCERRADA" ? dataPassada(Math.max(0, ocorrencia.diasDesdeAbertura - 1)) : null,
          ocorrencia.encerradaPorId,
        ],
      );
      if (ocorrencia.temDenunciante) {
        await registrar(
          "denunciante",
          `INSERT INTO denunciante (id, ocorrencia_id, nome, cpf, telefone, email, cep, endereco, bairro_residencial)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (ocorrencia_id) DO NOTHING`,
          [id("91000000", OCORRENCIAS.indexOf(ocorrencia) + 1), ocorrencia.id, ocorrencia.nomeDenunciante,
            cpfFicticio(), telefoneFicticio(), null, null, enderecoAleatorio(), pick(BAIRROS)],
        );
      }
      if (ocorrencia.temDenunciado) {
        await registrar(
          "denunciado",
          `INSERT INTO denunciado (id, ocorrencia_id, nome, cpf, telefone, endereco, observacoes)
           VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (ocorrencia_id) DO NOTHING`,
          [id("92000000", OCORRENCIAS.indexOf(ocorrencia) + 1), ocorrencia.id, ocorrencia.nomeDenunciado,
            cpfFicticio(), telefoneFicticio(), enderecoAleatorio(), null],
        );
      }
      // Movimentações: sempre REGISTRADA; EM_ATENDIMENTO/ENCERRADA passam
      // por EQUIPE_DESPACHADA antes — assim a transição bate com o CHECK da
      // tabela sem precisar saber quais providências permitem fechamento
      // direto a partir de ABERTA.
      const movIndiceBase = (OCORRENCIAS.indexOf(ocorrencia) + 1) * 10;
      let movIndice = 0;
      const dataAbertura = dataPassada(ocorrencia.diasDesdeAbertura);
      await registrar(
        "movimentacao_ocorrencia",
        `INSERT INTO movimentacao_ocorrencia (id, ocorrencia_id, usuario_id, tipo_movimentacao, status_anterior, status_novo, data)
         VALUES ($1, $2, $3, 'REGISTRADA', NULL, 'ABERTA', $4) ON CONFLICT (id) DO NOTHING`,
        [id("93000000", movIndiceBase + movIndice++), ocorrencia.id, ocorrencia.registradoPorId, dataAbertura],
      );
      if (ocorrencia.statusOcorrencia === "EM_ATENDIMENTO" || ocorrencia.statusOcorrencia === "ENCERRADA") {
        await registrar(
          "movimentacao_ocorrencia",
          `INSERT INTO movimentacao_ocorrencia (id, ocorrencia_id, usuario_id, tipo_movimentacao, status_anterior, status_novo, data)
           VALUES ($1, $2, $3, 'EQUIPE_DESPACHADA', 'ABERTA', 'EM_ATENDIMENTO', $4) ON CONFLICT (id) DO NOTHING`,
          [id("93000000", movIndiceBase + movIndice++), ocorrencia.id, pick(AGENTES).id, dataPassada(Math.max(0, ocorrencia.diasDesdeAbertura - 1))],
        );
      }
      if (ocorrencia.statusOcorrencia === "ENCERRADA") {
        await registrar(
          "movimentacao_ocorrencia",
          `INSERT INTO movimentacao_ocorrencia (id, ocorrencia_id, usuario_id, tipo_movimentacao, status_anterior, status_novo, data)
           VALUES ($1, $2, $3, 'ENCERRADA', 'EM_ATENDIMENTO', 'ENCERRADA', $4) ON CONFLICT (id) DO NOTHING`,
          [id("93000000", movIndiceBase + movIndice++), ocorrencia.id, ocorrencia.encerradaPorId, dataPassada(Math.max(0, ocorrencia.diasDesdeAbertura - 1))],
        );
      }
    }

    // ── Processos sanitários ──
    for (const processo of PROCESSOS) {
      processo.protocolo = protocoloDe(processo.protocoloNumero);
      await registrar(
        "processo_sanitario",
        `INSERT INTO processo_sanitario (
           id, protocolo, data_abertura, doenca_id, cid, laboratorio_id, ocorrencia_id, urgente,
           status_processo, resultado_laboratorial_id, data_resultado, desfecho_animal_id, criado_por_id
         ) VALUES ($1, $2, $3, $4, (SELECT cid FROM doenca WHERE id = $4), $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (id) DO NOTHING`,
        [
          processo.id, processo.protocolo, dataPassada(processo.diasDesdeAbertura), doencaIdPorCodigo[processo.doencaCodigo],
          laboratorioIdPorCodigo[processo.laboratorioCodigo], processo.ocorrenciaId, processo.urgente, processo.statusProcesso,
          processo.resultadoVigente ? resultadoLaboratorialIdPorCodigo[processo.resultadoVigente.resultadoCodigo] : null,
          processo.resultadoVigente ? dataPassada(processo.resultadoVigente.diasDesde) : null,
          processo.desfechoCodigo ? desfechoAnimalIdPorCodigo[processo.desfechoCodigo] : null,
          processo.criadoPorId,
        ],
      );
    }
    // Responsável e amostras (obrigatórios por processo — trigger deferida,
    // checada só no COMMIT no fim desta função).
    for (const responsavel of RESPONSAVEIS_PROCESSO) {
      await registrar(
        "responsavel_processo",
        `INSERT INTO responsavel_processo (id, processo_id, nome, cpf, telefone, email, cep, endereco, bairro_residencial, bairro_ocorrencia)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (processo_id) DO NOTHING`,
        [responsavel.id, responsavel.processoId, responsavel.nome, responsavel.cpf, responsavel.telefone,
          responsavel.email, responsavel.cep, responsavel.endereco, responsavel.bairroResidencial, responsavel.bairroOcorrencia],
      );
    }
    for (const amostra of AMOSTRAS) {
      await registrar(
        "animal_amostrado",
        `INSERT INTO animal_amostrado (
           id, processo_id, animal_id, especie_id, sexo, raca, coloracao, pelagem, idade_aprox, peso_kg,
           status_clinico, tipo_abrigo, alteracao_comportamental, data_coleta, material_biologico,
           contato_humano, nivel_contato, agrediu_humano, observacoes
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
         ON CONFLICT (id) DO NOTHING`,
        [
          amostra.id, amostra.processoId, amostra.animalId, especieIdPorCodigo[amostra.especieCodigo], amostra.sexo,
          amostra.raca, amostra.coloracao, amostra.pelagem, amostra.idadeAprox, amostra.pesoKg, amostra.statusClinico,
          amostra.tipoAbrigo, amostra.alteracaoComportamental, dataPassada(amostra.diasDesdeColeta), amostra.materialBiologico,
          amostra.contatoHumano, amostra.nivelContato, amostra.agrediuHumano, amostra.observacoes,
        ],
      );
    }
    for (const amostraSintoma of AMOSTRA_SINTOMAS) {
      await registrar(
        "amostra_sintoma",
        `INSERT INTO amostra_sintoma (animal_amostrado_id, sintoma_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [amostraSintoma.animalAmostradoId, sintomaIdPorCodigo[amostraSintoma.sintomaCodigo]],
      );
    }
    for (const resultado of RESULTADOS_PROCESSO) {
      await registrar(
        "resultado_processo",
        `INSERT INTO resultado_processo (id, processo_id, resultado_laboratorial_id, data_resultado, observacoes, retifica_id, registrado_por_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING`,
        [resultado.id, resultado.processoId, resultadoLaboratorialIdPorCodigo[resultado.resultadoCodigo],
          dataPassada(resultado.diasDesde), resultado.observacoes, resultado.retificaId, resultado.registradoPorId],
      );
    }

    // Mantém protocolo_sequencia consistente: a próxima ocorrência/processo
    // criado pela aplicação continua a numeração sem colidir com o seed.
    await registrar(
      "protocolo_sequencia",
      `INSERT INTO protocolo_sequencia (entidade, ano, ultimo) VALUES ('OCORRENCIA', $1, $2)
       ON CONFLICT (entidade, ano) DO UPDATE SET ultimo = GREATEST(protocolo_sequencia.ultimo, EXCLUDED.ultimo)`,
      [ANO_ATUAL, OCORRENCIAS.length],
    );
    await registrar(
      "protocolo_sequencia",
      `INSERT INTO protocolo_sequencia (entidade, ano, ultimo) VALUES ('PROCESSO', $1, $2)
       ON CONFLICT (entidade, ano) DO UPDATE SET ultimo = GREATEST(protocolo_sequencia.ultimo, EXCLUDED.ultimo)`,
      [ANO_ATUAL, PROCESSOS.length],
    );

    // ── Auditoria (amostra pequena, só pra tela de auditoria não ficar vazia) ──
    let indiceAuditoria = 1;
    for (const usuario of USUARIOS) {
      await registrar(
        "auditoria_evento",
        `INSERT INTO auditoria_evento (id, usuario_id, acao, entidade) VALUES ($1, $2, 'LOGIN', 'usuario') ON CONFLICT (id) DO NOTHING`,
        [id("80000000", indiceAuditoria++), usuario.id],
      );
    }
    for (const animal of ANIMAIS.slice(0, 5)) {
      await registrar(
        "auditoria_evento",
        `INSERT INTO auditoria_evento (id, usuario_id, acao, entidade, payload_depois)
         VALUES ($1, $2, 'CRIACAO', 'animal', $3) ON CONFLICT (id) DO NOTHING`,
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
