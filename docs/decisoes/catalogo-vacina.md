# Decisões — catálogo de vacinas (`/api/vacinas`) e melhorias de interface

Uma linha por decisão, com data e motivo. Nunca reescrever o histórico — acrescentar "Revisão de DD/MM/AAAA".

Contexto (25/10/2026): o formulário de registro de vacinação não dizia nada sobre a próxima aplicação, e não
havia como cadastrar uma vacina nova — o catálogo do frontend era um hardcode com `FIXME(T22)` e o backend
não tinha CRUD de `vacina`.

## Catálogo de vacinas

- **CV-1** (25/10/2026) O catálogo ganha CRUD real em `/api/vacinas`, espelhando o par Medicamento. Motivo: é
  o único caminho em que o "+" ao lado do campo Vacina realmente cadastra; sem backend, a tela seria
  decorativa.
- **CV-2** Nenhuma migration: a tabela `vacina` existe desde a V5 e a entidade também. Motivo: o escopo cabe
  nas colunas existentes (`codigo`, `nome`, `intervalo_meses`, `ativo`).
- **CV-3** Escrita usa `GESTAO_ANIMAIS:escrita` (Administrador **e Veterinário**), não uma autoridade
  própria de administrador. Motivo: criar autoridade nova exigiria migration em `cargo_permissao`,
  contrariando a CV-2. Consequência aceita: diverge do texto "administrador" da regra 23 do DER — registrado
  como pendência N-14 do TG. Desativar continua exclusivo do Administrador (`:exclusao`).
- **CV-4** `codigo` é derivado do nome por slugificação, e não enviado pelo cliente. Motivo: o usuário do CCZ
  não tem por que inventar um slug, e como a tabela não tem `UNIQUE(nome)` é o código derivado que impede
  "Antirrábica"/"antirrabica"/"ANTIRRABICA" virarem três vacinas. A derivação reproduz os 8 códigos do seed
  V5, travado por teste parametrizado.
- **CV-5** `codigo` é **imutável** no PUT: renomear altera só o `nome`. Motivo: é a chave usada por
  `VacinacaoService.resolverVacina` e já saiu em respostas como `vacinaCodigo`; recalculá-lo quebraria o
  vínculo dos registros gravados. Mesmo argumento do microchip na RN01.
- **CV-6** Nome que produz código vazio ou maior que 30 caracteres é recusado com **422** apontando o campo
  `nome`, nunca truncado. Motivo: truncar faria nomes diferentes colidirem silenciosamente no mesmo código.
- **CV-7** Duplicidade responde **409 com mensagem que nomeia a vacina em conflito** (e orienta a reativar,
  quando a existente está inativa). Motivo: o código não aparece em lugar nenhum da interface — um 409
  genérico deixaria o usuário sem entender por que "V4 felinos" foi recusado existindo "V4 (felinos)".
- **CV-8** Existe reativação (`PUT` com `ativo: true`) e filtro "Mostrar inativas" na tela, diferente do
  medicamento, que deliberadamente não tem. Motivo: com o código derivado, recadastrar uma vacina desativada
  daria 409 sem saída — o usuário não veria o registro inativo nem teria como reverter senão por SQL.
- **CV-9** `intervaloMeses` aceita nulo e tem teto de 1200 (`@Max`). Motivo: nulo é vacina sem reforço
  (RN-A03, coluna nullable desde a V5); o teto evita que `dataAplicacao.plusMonths(n)` estoure o `LocalDate`
  e vire 500.
- **CV-10** `VacinacaoService.resolverVacina` passa a recusar vacina **inativa** em registro novo (422,
  RN-C09), mantendo a mensagem e o status atuais. Motivo: até agora nada na aplicação sabia desativar uma
  vacina, então a brecha era inalcançável; com o DELETE ela deixa de ser. Precedentes do mesmo idioma:
  `ExameService#resolverTipoExame` e a decisão DH-22 da T37.
- **CV-11** A retificação continua aceita quando mantém a **mesma vacina** do registro original, mesmo
  inativa. Motivo: correção de registro clínico é sempre um POST novo (RN-C02/RN06); recusá-la tornaria
  impossível corrigir um histórico cuja vacina saiu do catálogo depois.
- **CV-12** O filtro de vacina ativa é feito em memória (`.filter(Vacina::isAtivo)`), não por
  `findByCodigoAndAtivoTrue`. Motivo: três testes de `VacinacaoServiceTest` mockam `findByCodigo`; trocar a
  assinatura os faria devolver `Optional.empty()` e quebrar silenciosamente.
- **CV-13** Sem `@CacheEvict` nos KPIs do dashboard. Motivo: contraria a decisão já registrada em
  `CacheConfig` e em `docs/contratos/dashboard-kpis.md`. Consequência aceita e documentada: o efeito de
  desativar uma vacina nos indicadores pode levar até 5 minutos para aparecer.
- **CV-14** As escritas no catálogo **não** geram auditoria, seguindo o medicamento ("catálogo mutável, sem
  auditoria"). **Pendente de decisão dos autores:** editar `intervalo_meses` muda retroativamente a data de
  validade de todas as vacinações daquela vacina, e desativar apaga alertas de reforço — é defensável que a
  trilha registre isso. Levar junto com a CV-13.
- **CV-15** (revisão de 01/11/2026) Não há mais hardcode de vacinas no frontend a remover: a `main` já havia
  apagado `catalogoClinico.ts` ao levar o catálogo clínico para a API, encerrando o `FIXME(T22)` por outro
  caminho. A decisão original (tirar o `VACINAS` daqui) ficou sem objeto.

## Interface

- **CV-16** O formulário de vacinação mostra ao vivo "Próximo reforço: DD/MM/AAAA (intervalo de N meses)",
  derivado, em vez de ganhar um campo de próxima aplicação persistido. Motivo: a validade é derivada por
  decisão do DER (`data_aplicacao + intervalo_meses`, sem coluna); persistir um campo novo mudaria a RN-A01
  e o TG. O que faltava era visibilidade, não dado.
- **CV-17** `lib/datas.ts#adicionarMesesIso` replica o truncamento de fim de mês do `LocalDate.plusMonths`
  (31/01 + 1 mês = 28/02). Motivo: um `Date.UTC(ano, mes + n, dia)` ingênuo daria 03/03, e a previsão no
  formulário divergiria da data que a tabela mostra depois de salvar.
- **CV-18** (revisão de 01/11/2026) O select de vacina **continua** com `register()`, via
  `SelectCatalogoClinico`. A decisão original trocava por `Controller`; a `main` resolveu o mesmo problema
  (select não-controlado montando antes das opções) extraindo esse componente, que só monta o select com as
  opções já carregadas e trata carregando/erro/vazio com retry. Preservar a solução da `main` vale mais do que
  a troca — e o `intervaloMeses` passou a vir do próprio catálogo (CV-28), então o `Controller` deixou de ter
  motivo.
- **CV-19** (revisão de 01/11/2026) **Não há ida ao catálogo nem caminho de retorno.** O "+" abre um
  sub-cadastro **in loco**, dentro do próprio modal, e o item criado fica escolhido no formulário de cima.
  Motivo: é o padrão que a `main` já tem em `Medicamentos.tsx` para a categoria farmacológica
  (`setValue(..., { shouldValidate: true })`), e o projeto nunca guardou caminho de retorno em query string.
  Dispensa `lib/retornoSeguro.ts`, parâmetros de URL em `FichaAnimal` e props novas nas abas — e o que já foi
  digitado nunca sai da tela, então não depende do rascunho para sobreviver.
  - Consequência: as decisões **CV-20** (validar `?retorno=` contra open redirect) e **CV-21** (rascunho
    cobrindo a ida e a volta) ficaram sem objeto. A tela `/vacinas` continua existindo para renomear, ajustar
    intervalo e desativar.
- **CV-22** (revisão de 01/11/2026) O "+" **não** tem checagem de papel própria. Motivo: a aba só oferece o
  caminho para o modal a quem tem escrita (`podeEscrever`, Admin e Vet), então um guard aqui seria código
  inalcançável; o backend recusa o POST de qualquer outro perfil.

## Registro de reforço (25/10/2026, após uso real)

- **CV-23** A aba de vacinas ganha uma ação própria **"Registrar reforço"**, separada de "Corrigir". Motivo:
  sem ela, a saída natural de quem via a vacina vencendo era clicar em "Corrigir" e trocar a data — o que
  cria uma **retificação** e marca a aplicação anterior como `RETIFICADO`, como se ela nunca tivesse valido.
  O alerta até sumia, o que escondia o estrago. Reforço e correção são coisas diferentes: o reforço **sucede**
  a aplicação anterior, a correção **invalida** o registro errado.
- **CV-24** O reforço é um POST **sem `retificaId`**, com a vacina pré-selecionada e a data de hoje
  preenchida. Motivo: é uma aplicação nova e independente; a RN-A02 já faz a mais recente ser a vigente, e o
  alerta se recalcula a partir dela.
- **CV-25** A ação aparece só na linha **vencida ou a vencer (≤ 7 dias)** e só na **aplicação vigente** da
  vacina (a mais recente ativa). Motivo: é exatamente a janela do alerta (RN-A01) e a aplicação que a RN-A02
  considera; oferecer em todas as linhas repetiria o botão para a mesma vacina.
- **CV-26** Fora dessa janela o reforço **não é bloqueado**: o botão "Registrar vacina" do topo continua
  disponível para qualquer aplicação. Motivo: antecipar um reforço é legítimo (adoção, viagem, protocolo
  próprio); a janela organiza o caminho comum sem impedir o caso excepcional.
- **CV-27** O modal de correção passa a dizer explicitamente que a aplicação original constará como
  retificada e que, para uma nova aplicação, o caminho é "Registrar reforço". Motivo: o texto anterior
  ("cria um novo registro vinculado a ele") era verdadeiro e ainda assim ambíguo para quem queria o reforço.

## Integração à `main` (01/11/2026)

O trabalho acima foi feito em 25/10/2026 numa pilha de branches locais e integrado à `main` em 01/11/2026,
35 commits depois — entre eles três PRs de refatoração (#115/#116/#117). A integração portou as
funcionalidades à mão em vez de mesclar a pilha, para não reintroduzir código pré-refatoração.

- **CV-28** `intervaloMeses` vem de **estender só a lista `vacinas`** de `GET /api/animais/catalogos`
  (`VacinaCatalogoResponse`), não de uma segunda consulta a `/api/vacinas` no modal. Motivo: o select já é
  alimentado por esse endpoint; duas fontes para a mesma entidade teriam de ser invalidadas em sincronia.
  `CatalogoItemResponse` ficou intacto — é compartilhado por seis outros catálogos que não têm intervalo.
- **CV-29** As mutações de vacina invalidam **`['animais','catalogos']`** além de `['vacinas']`. Motivo:
  `useCatalogosAnimaisQuery` tem `staleTime: Infinity` e `invalidarAnimaisEBaias` exclui `'catalogos'` do
  predicate de propósito (T45). Sem isso o "+" pareceria não funcionar.
- **CV-30** A seleção da vacina recém-cadastrada **espera a `<option>` existir** (efeito observando o
  catálogo), em vez de `setValue` direto no retorno do POST. Motivo: o select é não-controlado; invalidar,
  refazer a consulta e re-renderizar acontece depois de o POST resolver, e um `setValue` antes disso é
  descartado pelo DOM, que cai na primeira opção. No modal de medicamento o `setValue` basta, porque lá o
  select é controlado (`Controller`).
- **CV-31** O contador de ocorrências abertas no menu lateral da pilha original foi **descartado**: a `main`
  já tinha `useOcorrenciasAbertasCount`, com o mesmo endpoint e filtro, mais `signal` de cancelamento, mapa
  `contadores[entry.id]` extensível e 6 testes dedicados. A versão da pilha era estritamente inferior; manter
  as duas duplicaria o mecanismo.
- **CV-32** Da reescrita de alertas do dashboard aproveitou-se **só** a parte dos 5 agregados (viraram chips).
  Os dois cards ricos (vacinas e processos urgentes) são os da `main`, que já os reescreveu com achatamento
  animal→vacina, severidade por ícone+cor+texto, ordenação por urgência e estados de erro/carregando.
- **CV-33** O resumo do sino **reusa** `useKpisDashboardQuery` e `useProcessosUrgentesQuery` em vez de
  declarar consultas próprias. Motivo: as chaves são as mesmas, e dois observadores numa chave com `queryFn`
  diferente fariam o cache depender de quem montasse primeiro — sino e dashboard discordariam em silêncio.
- **CV-34** O `ToastProvider` entrou e os três `alert success` existentes (medicamento, perfil,
  configurações) foram convertidos a ele. Motivo: a regra é um mecanismo só de confirmação; manter o banner
  em três telas e o toast no resto seriam dois. O CSS `.toast` já existia órfão em `components.css`, portado
  do protótipo — mesmo precedente de `Skeleton.tsx` com `.skel`. Erro de campo e de regra **continuam
  inline**: o toast é só confirmação.
- **CV-35** `/api/vacinas` entrou no `@ValueSource` de `TetoDePaginaIT` e as assertivas de
  `AnimalControllerIT` sobre a lista de vacinas passaram de `containsInAnyOrder` para `hasItems`. Motivo: com
  o POST novo, outros ITs cadastram vacinas no mesmo banco (a JVM compartilha o Postgres, sem rollback), e
  exigir conjunto exato tornava os testes dependentes da ordem de execução.

## Redesenho das telas de catálogo (01/11/2026)

As telas `/vacinas` e `/medicamentos` eram as duas únicas telas de lista fora do padrão do projeto, e isso
era em boa parte consequência de elas fazerem pouco. Nenhum endpoint foi criado ou alterado.

- **CV-36** As duas telas passam ao esqueleto das outras seis (`page-header` → `.filter-bar` → `.table-wrap`
  → `.table-footer`), com **cadastro em modal**. Motivo: o formulário sempre aberto ocupava um terço da
  altura e empurrava o catálogo — a razão de abrir a tela — para baixo da dobra.
- **CV-37** Os filtros (busca, situação, categoria) são aplicados **em memória**, não por requisição, como em
  `Usuarios.tsx`. Motivo: a faixa de resumo precisa do conjunto completo de qualquer forma, então carregar
  tudo numa página e filtrar no cliente é a única escolha coerente — e evita uma requisição por tecla nas
  máquinas de ~2 GB. Os parâmetros `ativo`/`categoriaId` do backend continuam servindo os outros consumidores.
- **CV-38** A tela de vacinas ganha **edição** (nome e intervalo). Motivo: o `PUT` sempre aceitou os dois, mas
  a interface só o usava para virar `ativo`; sem isso o CCZ não tinha como corrigir o intervalo de 12 meses
  que a V5 marca como provisório ("CONFIRMAR com a equipe veterinária"). Fecha o que a CV-19 já prometia.
- **CV-39** O modal de edição avisa, **antes de salvar**, que mudar o intervalo recalcula a validade de todas
  as aplicações já lançadas daquela vacina. Motivo: a validade é derivada, não persistida — nenhum registro é
  tocado, mas a ficha e o alerta passam a mostrar outra data, e nada na interface dizia isso.
- **CV-40** O `codigo` aparece **somente-leitura** no modal de edição. Motivo: ele nunca aparecia em lugar
  nenhum, mas é o que a mensagem de 409 cita (CV-7) — o usuário lia um erro sobre algo que a tela nunca
  mostrou. Continua sem aparecer no cadastro, onde ainda não existe.
- **CV-41** Coluna "Em alerta" na tela de vacinas, com os animais de reforço vencido ou a vencer, agrupados
  de `GET /api/alertas/vacinas` por `vacinaId`. Motivo: é o único dado relacional alcançável pelo frontend com
  `GESTAO_ANIMAIS:leitura` e sem backend novo, e reusa a `queryKey` `['alertas','vacinas']` do dashboard, logo
  não custa requisição. A interface declara as ressalvas da regra (janela de 7 dias, só animais sob custódia,
  só a aplicação vigente) porque senão o número engana; o traço em vacina inativa ou sem intervalo é a
  resposta certa (RN-A03), não dado faltando.
  - Descartados: aplicações por vacina (exige `RELATORIOS:leitura`, período obrigatório e é chaveada por
    nome) e prescrições por medicamento (não existe em forma nenhuma no backend).
- **CV-42** A tela de medicamentos ganha **editar, desativar, ver inativos e filtrar por categoria** — tudo
  com endpoint que já existia, inclusive o `?categoriaId=` que nunca tinha sido usado. Ganha também camada de
  dados própria: antes lia pelo fetcher do select de prescrição (`ativo=true` fixo, teto de 100), então nunca
  enxergava o catálogo inteiro.
- **CV-43** A confirmação de desativar medicamento diz que **não há volta**. Motivo: diferente da vacina,
  `AtualizarMedicamentoRequest` não tem `ativo` e não existe reativação (CV-8). O inativo aparece no filtro
  com "Sem reativação" no lugar das ações, para a assimetria ficar visível em vez de surpreender.
- **CV-44** `.table-toolbar` (CSS órfão que serviria de barra de ações dentro do `.table-wrap`) foi
  **considerado e descartado**: a `.filter-bar` acima da tabela já resolve e é o que as outras seis telas
  usam. Consistência vale mais do que adotar um órfão só porque ele existe.

## Integração com a `main` depois do PR #119 (01/11/2026)

A branch de UX entrou na `main` trazendo fundações compartilhadas que não existiam quando este trabalho
começou. O merge foi resolvido adotando-as.

- **CV-45** `Modal`, `AlertaErroEnvio` e o par `aria-invalid`/`aria-describedby` da `main` substituem o
  esqueleto de modal feito à mão e os `alert danger` crus. Motivo: o `Modal` tem `role="dialog"`,
  `aria-modal`, foco preso, Esc e devolução de foco, e não fecha por clique fora — nada disso existia nos
  sete modais copiados. Os dois modais clínicos partem da versão da `main`, com o cadastro rápido e a
  previsão de reforço reaplicados por cima.
- **CV-46** O **Dashboard fica inteiro com a `main`, e os chips saem.** Motivo: além do link "ver baias", a
  `main` separou os alertas por severidade em "Alertas Críticos" e "Acompanhamento" — isso resolve a
  aglomeração que motivou os chips usando um critério que significa algo, e os cards preservam a descrição
  completa, que o chip jogava para o `title`.
- **CV-47** **Um mecanismo de feedback só, com as funcionalidades do toast sobre a arquitetura do
  `avisar()`.** A `main` tinha `Avisos` + store de módulo; este trabalho tinha um `ToastProvider` com
  Context. Trocar um pelo outro não servia:
  - o Context quebrou **377 testes em 46 arquivos**, porque `useToast` lança fora do provider e o
    `AuthContext` passou a consumi-lo — toda árvore de teste que monta o `AuthProvider` teria de montar um
    provider de UI só para não quebrar;
  - o store de módulo não tinha pausa no hover/foco, limite de fila nem região `assertive` separada.

  O resultado é `components/toast/`: store de módulo com `useSyncExternalStore` (chamável de fora do React,
  sobrevive à navegação, dedupe de texto igual) desenhado por um `<Toasts />` montado na raiz, que mantém a
  pausa no hover e no foco, o teto de 3 avisos e o `prefers-reduced-motion`. Erro leva `role="alert"` no
  próprio item — o contêiner de erros não tem `aria-live`, que duplicaria o anúncio.
- **CV-48** As mensagens das exceções de vacina passam ao padrão que a `main` adotou em `433be7c`:
  acentuadas, frase completa, com ponto final.
