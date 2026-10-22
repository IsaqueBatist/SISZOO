# Decisões — ficha completa, seed e fuso (branch `fix/ficha-completa-seed-fuso`)

Uma linha por decisão, no formato de `T29.md`. Origem: roteiro de testes manuais (`docs/roteiro-testes-manuais.md`) e as revisões que se seguiram. Regras de referência: DER §3.2 (`ficha_completa`, `esterilizado`, baia), regras 4 e 25 do DER §5, RN-AN02 e RN-AN04 (`docs/regras-negocio-clinico.md`), AC-1 a AC-5 (`docs/decisoes/animais-clinico-correcoes.md`).

## Decisões

- **FS-1** O seed (`scripts/seed-test-data.mjs`) não tem cópia da regra de ficha completa: não grava `ficha_completa` (fica o `DEFAULT false` da V4) e cria as vacinações por `POST /api/vacinacoes`, para o `VacinacaoService` recalcular a ficha. Consequências aceitas: o seed exige o backend no ar (`SEED_API_URL`) e as vacinações dele geram eventos de auditoria. Teste: `scripts/seed-test-data.test.mjs` (`npm run test:seed`), invariante sobre todos os animais do banco.
- **FS-2** A regra de ficha completa vive em execução só no `FichaCompletaService`. A cópia em SQL da V18 é congelada (já aplicada, não roda de novo, não pode ser editada por causa do checksum do Flyway); mudar a regra exige uma migration nova de recálculo. Espelhos que acompanham a regra: `fichaCompletaMock` (`frontend/src/mocks/handlers.ts`) e o teste do seed.
- **FS-3** Datas de negócio na virada do dia UTC × Itu são cobertas por testes de instante fixo (20:59, 21:00, 23:59 e 00:00 BRT, viradas de mês e de ano às 21:30), com o fuso do `Clock` de produção: `RegrasDeDataNaViradaDoDiaTest` (backend) e `lib/hojeNoFusoDeItu.test.ts` (front). No backend nenhum bug foi reproduzido; a prova de que os testes pegam o erro é por contraprova (mutação).
- **FS-4** O front tem uma única função de "hoje": `lib/datas#hojeEmItu`. As cópias `hojeIso` de ocorrências e de processos foram removidas.
- **FS-5** A ficha do animal mostra "Ficha incompleta" quando `fichaCompleta` é `false`. O protótipo só desenha o estado completo; o incompleto usa `--color-warning`.
- **FS-6** `esterilizado` é obrigatório no cadastro **e na edição** do animal (`@NotNull Boolean` em `CriarAnimalRequest` e `AtualizarAnimalRequest`), e a ausência responde no padrão de validação (422, `"Dados invalidos"` + `campos` com `esterilizado`). Fundamento:
  - RN07 do DOCX lista `esterilizado` entre os obrigatórios do cadastro (`pendencias-auditoria-rn.md`, D6; a dúvida aberta ali é sobre `porte` e `baia`);
  - DER §3.2 marca o campo como obrigatório; o `DEFAULT false` da V4 é o comportamento do banco quando a coluna é omitida num `INSERT`, não regra de API (nenhuma migration posterior mudou a coluna);
  - o PUT do animal substitui a ficha inteira (I1 em `auditoria-rn.md`), então omitir o campo desmarcaria a castração sem aviso; os booleanos do PUT de ocorrência (`AtualizarOcorrenciaRequest`) já são `@NotNull` pelo mesmo motivo;
  - o front sempre envia o campo (`AnimalForm.tsx`, cartões de castração), agora conferido em `AnimalForm.test.tsx`.

  Não é regra nova: com o `boolean` primitivo, o campo ausente já era recusado (400 genérico do Spring); muda só a resposta. Os outros booleanos de request seguem a mesma lógica: obrigatórios onde a regra ou a substituição do PUT exige (`@NotNull`), opcionais com `false` explícito no serviço onde não (cadastro de ocorrência).
- **FS-7** A coleção do Insomnia segue as regras atuais: os cadastros de animal enviam `esterilizado`, e alocar animal em baia sem vaga espera 409 (`ut_baias_animal_409_baia_superlotada`, antes `ut_baias_animal_pode_ser_alocado_em_baia_superlotada`). `ut_animais_criar_422_catalogos_invalidos` tem caso de controle (payload base aceito) e confere a mensagem de cada catálogo.
- **FS-8** O alerta `baia_superlotada` (DER, `alerta_item`, ainda não implementado) usa `atual_ocupacao >= capacidade`, a mesma regra do indicador `superlotada` (`BaiaService.java`, `ocupacaoAtual >= capacidade`; `estadoLotacao.ts`, `>= 100%`) e do 409 de baia sem vaga (RN-AN02). Decisão da equipe na revisão desta branch; antes o DER dizia `>` só no alerta. Implementação, testes (`BaiaServiceTest`, `estadoLotacao.test.ts`, limite exato) e a exclusão de baia ocupada (AC-3) não mudam.
- **FS-9** Autenticado sem permissão recebe **403 antes da validação do corpo**. A autorização é por método (`@PreAuthorize`, só `hasAuthority(...)`); o `@Valid` do `@RequestBody` era avaliado antes dele. `PreAutorizacaoInterceptor` (registrado em `WebMvcConfig`) avalia o mesmo `@PreAuthorize` com o `PreAuthorizeAuthorizationManager` antes de ler o corpo e lança `AccessDeniedException` (403 "Acesso negado" pelo `JwtAccessDeniedHandler`). Sem mudança na ordem dos filtros nem no `SecurityConfig`; sem autenticação o filtro continua respondendo 401; com permissão, o 422 de validação não muda; a checagem por método continua como segunda camada. Limite: os argumentos do método ainda não foram lidos quando o interceptor roda. Um `@PreAuthorize` com argumentos (`#param`) seria avaliado com tudo nulo, dando um resultado errado sem aviso. Por isso ele é **recusado de forma explícita**: o interceptor lança `IllegalStateException` com o endpoint e a expressão, e `PreAuthorizeSemArgumentosTest` varre os `@PreAuthorize` de todos os controllers e quebra o build se algum usar `#`. Testes: `AutorizacaoAntesDaValidacaoIT`, `PreAutorizacaoInterceptorTest`, `PreAuthorizeSemArgumentosTest`.
- **FS-10** Datas com hora da API (`LocalDateTime`, horário de Itu) são exibidas separando a string, sem `new Date(iso)`: `formatarDataBR`/`formatarDataHoraBR` em `Perfil` e `Usuarios`. "Última atualização" na ficha do animal conta dias civis em Itu (`diasCivisAteHoje`). As datas relativas do mock partem de `hojeEmItu`. Testes: `lib/datasNaTela.test.tsx` (navegador em UTC e em São Paulo), `mocks/datasMock.test.ts`, `lib/datas.test.ts`.
- **FS-11** A RN-AN04 tem IT pela API para cadastro, primeira vacinação, edição (microchip definido depois da vacina) e retificação de vacinação (`AnimalControllerIT#fichaCompletaNaEdicaoENaRetificacao`). Exclusão de vacinação não existe (V17).
- **FS-12** O mock do front segue o contrato de datas da API: nenhum DTO de resposta usa instante (só `LocalDateTime`, `LocalDate` e `LocalTime`), então o mock não devolve datas com `Z` e cria registros com `agoraEmItu()` (`lib/datas.ts`). Teste: `mocks/contratoDatasMock.test.ts`.
- **FS-13** O dashboard (T38, integrado pela `main`) calcula dia, hora e ano pelo `Clock`; as consultas comparam colunas de data civil com esses parâmetros, sem `CURRENT_DATE` no banco. Coberto nos instantes de FS-3 em `DashboardServiceTest`.
- **FS-14** O seed corrige sozinho a ficha gravada pela versão anterior dele (ver a seção abaixo).

## Bancos semeados pela versão anterior do seed

A versão anterior do seed gravava `ficha_completa` = "tem microchip" direto no `INSERT`. Num banco semeado por ela, animais com microchip e sem vacinação ficam "completos" (no seed padrão: Apolo, Bolt, Chico, Frajola e Rocky).

**O próprio seed corrige**, sem cópia da regra (FS-1) e sem migration (que rodaria também em produção). O registro errado é reconhecido pela **origem**, não pela regra: animal do seed (id fixo) com `ficha_completa = true` e `atualizado_em = criado_em`, ou seja, valor gravado por SQL e nunca recalculado pelo backend. Toda passagem pela aplicação muda `atualizado_em`, e o seed atual só deixa a ficha `true` por vacinação pela API. Para cada um, o seed faz GET + PUT com os mesmos valores (`recalcularFichasDoSeedAnterior`), e o `AnimalService` recalcula pelo `FichaCompletaService`:
- ficha errada vira `false`;
- ficha certa continua `true`, e o PUT não grava nada (o Hibernate não vê alteração).

Animais fora do seed e os já tocados pela aplicação nunca entram. O seed informa `ficha_corrigida_do_seed_anterior`.

**Validado** num banco descartável semeado pela versão anterior: 15 completas, 5 fora da regra → 10 completas, 0 fora da regra; demais colunas dos animais idênticas (hash antes = depois); 2ª execução corrige 0 e não grava nada (`ficha_completa` e `atualizado_em` iguais). Banco limpo: corrige 0. Teste: `seed-test-data.test.mjs` simula o estado da versão anterior num animal do seed.

## Pendências da revisão

| Id | Pendência | Status | Onde |
|---|---|---|---|
| FS-P1 | Perfil sem permissão recebia 422 em vez de 403 com corpo inválido | **Corrigida** | FS-9; `AutorizacaoAntesDaValidacaoIT` (antes: 4/4 falham com 422; depois: 4/4 passam) |
| FS-P2 | `ut_animais_criar_422_catalogos_invalidos` passava só pelo status | **Corrigida** | FS-7; controle + mensagem por catálogo; contraprovas: payload sem `esterilizado` falha, backend sem validação de espécie falha |
| FS-P3 | DER com duas fórmulas para baia superlotada | **Corrigida (documental)** | FS-8; DER `alerta_item` alinhado a `>=` por decisão da equipe |
| FS-P4 | Mock calculava "hoje" em UTC | **Corrigida** | FS-10; `datasMock.test.ts` (antes: 4/6 falham nos dois fusos; depois: 6/6) |
| FS-P5 | `new Date(iso)` em `FichaAnimal`, `Perfil` e `Usuarios` | **Corrigida** | FS-10; `datasNaTela.test.tsx` (antes: 6/10 falham; depois: 10/10 em UTC e em São Paulo) |
| FS-P6 | Testes não distinguem offset fixo `-03:00` de `America/Sao_Paulo` | **Não corrigível hoje** | Os dois são equivalentes desde 2019 (sem horário de verão); o código usa `ZoneId.of("America/Sao_Paulo")` e o front, `Intl` com `America/Sao_Paulo`. Nenhum offset fixo foi introduzido. |
| FS-P7 | Filtros de relatório por dia sem teste de fuso | **Corrigida** (sem defeito) | Bloqueada até a integração da `main`, porque a base da branch (`872b607`) não tinha o módulo; a T38 entrou pelo merge `c62b1db`. FS-13; `DashboardServiceTest` (contraprova: `ClockConfig` em UTC, 8 dos 9 casos novos falham) |
| A | `esterilizado` ausente no cadastro e na edição | **Corrigida** (contrato mantido e fundamentado) | FS-6; ITs de cadastro e edição (422 com o campo) e `AnimalForm.test.tsx` (contraprova: sem o campo no payload, 2 testes falham) |
| D | Animais com ficha errada em bancos semeados pela versão anterior | **Corrigida no seed** | FS-14 e a seção acima |
| G | Cobertura da regra de ficha completa | **Corrigida** | FS-11 (contraprova: sem recálculo na edição, a IT falha) |
| — | Mock com datas `Z`, fora do contrato da API | **Corrigida** | FS-12; `contratoDatasMock.test.ts` (antes: 8/9 falham; depois: 9/9) |
| — | `ut_usuarios_autodesativacao_admin` esperava 200, contra a regra 24 do DER | **Corrigida** | Espera 422 e confere que o usuário continua ativo; a versão anterior falha contra o backend |
| — | `@PreAuthorize` com `#param` seria avaliado em silêncio pelo interceptor | **Corrigida** | FS-9; recusa explícita + varredura no build (contraprovas: `#id` num controller real quebra a varredura; o interceptor anterior não recusava) |

## Riscos residuais e itens para a equipe

- **Interceptor de autorização (FS-9):** vale para todos os endpoints com `@PreAuthorize`. Um `@PreAuthorize` com argumentos do método é recusado no build e em tempo de execução; se um dia for necessário, a checagem antecipada precisará de outro desenho.
- **Seed em bancos antigos:** nas execuções seguintes à correção, as fichas `true` corretas do seed anterior continuam com `atualizado_em = criado_em` e são reconferidas (GET + PUT sem escrita) a cada execução. São no máximo 30 chamadas à API, sem alteração de dados.
- **Insomnia sem o runner oficial:** não há o CLI do Insomnia (`inso`) no ambiente. Os UnitTests foram executados com um runner temporário (shim de `insomnia.send`/`expect` sobre `fetch`, que lê também as Requests da coleção pelo id), contra backends descartáveis. Convém rodar a coleção no Insomnia antes do merge.
