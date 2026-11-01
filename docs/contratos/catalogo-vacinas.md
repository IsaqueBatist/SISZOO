# Contrato — `/api/vacinas` (catálogo de vacinas)

Status: **implementado** — `com.siszoo.animais.clinico.controller.VacinaController`.

Antes disto o catálogo de vacinas era só leitura: as 8 do seed `V5` saíam em `GET /api/animais/catalogos`
(desde o commit que levou o catálogo clínico para a API e removeu o hardcode de `catalogoClinico.ts`), mas
não havia como cadastrar, renomear nem desativar vacina pela aplicação — e o `intervalo_meses`, de onde sai a
data de validade de toda vacinação, só mudava por SQL. O catálogo agora é editável pelo CCZ, o que concretiza
a regra 23 do DER ("vacinas mantidas pelo administrador via Catálogos").

Não confundir com:

- `GET /api/alertas/vacinas` — alerta de reforço (outro módulo, `com.siszoo.alertas`);
- `/api/vacinacoes` — os registros clínicos de aplicação.

Nenhuma migration foi necessária: a tabela `vacina` existe desde a `V5__schema_clinico_catalogos.sql`.

## Endpoints

| Método | Caminho | Autoridade | Resposta |
|---|---|---|---|
| GET | `/api/vacinas?ativo=&pagina=&tamanho=` | `GESTAO_ANIMAIS:leitura` | `PaginaResponse<VacinaResponse>`, ordenado por nome |
| GET | `/api/vacinas/{id}` | `GESTAO_ANIMAIS:leitura` | `VacinaResponse` · 404 se não existe |
| POST | `/api/vacinas` | `GESTAO_ANIMAIS:escrita` | `VacinaResponse` (200) |
| PUT | `/api/vacinas/{id}` | `GESTAO_ANIMAIS:escrita` | `VacinaResponse` |
| DELETE | `/api/vacinas/{id}` | `GESTAO_ANIMAIS:exclusao` | `VacinaResponse` com `ativo=false` (200, **com corpo**) |

`GESTAO_ANIMAIS:escrita` é de Administrador **e Veterinário** — ou seja, o Veterinário também cadastra e
edita vacinas, embora o texto da regra 23 do DER fale em "administrador". Divergência deliberada: restringir
a Administrador exigiria uma autoridade nova em `cargo_permissao`, e portanto uma migration. Só a
desativação é exclusiva do Administrador (`:exclusao`). Registrado em `docs/decisoes/catalogo-vacina.md`.

## Payloads

```json
// POST  — sem `codigo`: o servidor o deriva do nome
{ "nome": "Antirrábica", "intervaloMeses": 12 }

// PUT   — sem `codigo`: ele é imutável
{ "nome": "Antirrábica (anual)", "intervaloMeses": 12, "ativo": true }

// VacinaResponse
{ "id": "…", "codigo": "antirrabica", "nome": "Antirrábica", "intervaloMeses": 12, "ativo": true }
```

- `nome`: obrigatório, até 100 caracteres, gravado sem espaços nas pontas.
- `intervaloMeses`: **opcional** (nulo = vacina sem reforço, que não gera alerta — RN-A03); quando
  informado, inteiro positivo com teto de 1200. O teto existe porque `Vacinacao#calcularDataValidade` faz
  `dataAplicacao.plusMonths(n)`, que estoura o `LocalDate` com um valor absurdo e viraria 500.

## `codigo` é derivado do nome e imutável

O `codigo` não aparece em nenhum request: o servidor o deriva do `nome` (NFD, remove acentos, minúsculas,
não-alfanumérico vira `_`, repetições colapsam, pontas aparadas). A regra reproduz exatamente os 8 códigos do
seed — `V4 (felinos)` → `v4_felinos` — e isso é travado por `VacinaServiceTest#deveReproduzirOsCodigosDoSeed`.

Motivos: o usuário do CCZ não tem por que inventar um slug; e, como a tabela **não** tem `UNIQUE(nome)`, é o
código derivado que impede "Antirrábica", "antirrabica" e "ANTIRRABICA" virarem três vacinas.

O `PUT` **não** recalcula o código: ele é a chave usada por `VacinacaoService.resolverVacina` e já saiu em
respostas anteriores como `vacinaCodigo`. Mesmo argumento do microchip na RN01.

## Erros

- **409** — o nome deriva um código já usado. A mensagem **nomeia a vacina em conflito**, porque o usuário
  nunca vê o código na tela: sem isso, "V4 (felinos)" e "V4 felinos" dariam um 409 sem explicação. Quando a
  vacina em conflito está inativa, a mensagem orienta a reativá-la.
- **422** — `nome` vazio, `intervaloMeses` não positivo, ou nome que não produz código válido (só pontuação,
  ou longo demais para os 30 caracteres da coluna). O código **nunca** é truncado em silêncio: truncar faria
  nomes diferentes colidirem.
- **404** — id inexistente em GET/PUT/DELETE.

## Reativação

Diferente do medicamento, que deliberadamente não tem reativação (ver o Javadoc de `MedicamentoController`),
aqui `PUT` com `ativo: true` reativa. Sem isso, recadastrar uma vacina desativada daria 409 sem saída: o
usuário não enxerga registros inativos e não teria como reverter senão por SQL. A tela de Vacinas tem, por
isso, a opção "Mostrar inativas".

## `intervaloMeses` no frontend — não duplicar a regra

O campo sai na resposta para a interface **prever** o próximo reforço enquanto o formulário de vacinação é
preenchido (`ModalRegistrarVacina`, usando `lib/datas.ts#adicionarMesesIso`, que replica o truncamento de
fim de mês do `LocalDate.plusMonths`).

Para uma vacinação **já gravada**, a data de reforço continua sendo `VacinacaoResponse.dataValidade`, que é a
fonte única da RN-A01 (`Vacinacao#calcularDataValidade` — o comentário na entidade registra que antes havia
4 cópias dessa conta). Não recalcular a partir do `intervaloMeses` nesse caso.


## `intervaloMeses` também no catálogo clínico

`GET /api/animais/catalogos` passa a devolver `vacinas` como
`{ codigo, nome, intervaloMeses }` (record `VacinaCatalogoResponse`), e não mais `CatalogoItemResponse`.

Motivo: o modal de vacinação precisa do intervalo para prever o próximo reforço, e é esse endpoint que
alimenta o select (`SelectCatalogoClinico`). A alternativa — o modal consultar `/api/vacinas` só para o
intervalo — deixaria a mesma entidade com **duas fontes** no frontend, que teriam de ser invalidadas em
sincronia. Com isto, `/api/vacinas` serve só à tela de catálogo.

`CatalogoItemResponse` **não** foi alterado: ele é compartilhado por espécies, status de animal, motivos de
entrada, tipos de baia, tipos de exame e laboratórios, nenhum dos quais tem intervalo. Como `codigo` e `nome`
mantêm os mesmos nomes, o `SelectCatalogoClinico` continua recebendo a lista sem mudança (em TS,
`VacinaCatalogo extends CatalogoItem`).

O endpoint já filtrava `vacina.ativo = true` (`findByAtivoTrueOrderByNomeAsc`), então **desativar uma vacina
já a remove do select** sem nenhuma mudança adicional.

### Invalidação no frontend

As mutações de `/api/vacinas` invalidam `['vacinas']` **e** `['animais','catalogos']`. A segunda não é
defensiva: `useCatalogosAnimaisQuery` tem `staleTime: Infinity` e `invalidarAnimaisEBaias` exclui
`'catalogos'` do predicate de propósito (T45). Sem ela, a vacina cadastrada pelo "+" não apareceria no select
e o botão pareceria não ter funcionado.

## Efeitos de desativar/editar

Descritos em `docs/regras-negocio-clinico.md`, seção "Efeito de desativar ou reeditar uma vacina do
catálogo", e resumidos na RN-C09.
