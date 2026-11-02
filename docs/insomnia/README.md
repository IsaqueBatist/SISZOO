# Coleção Insomnia - SISZOO

A pasta `.insomnia/` na raiz do repositório é uma coleção do
[Insomnia](https://insomnia.rest/) sincronizada via Git ("Git Sync"), com 42
requisições de exemplo para os endpoints de autenticação, usuários,
preferências, auditoria, animais, baias, registros clínicos e medicamentos,
além de suítes de testes automatizados (`insomnia.send()` + `chai`) que
verificam regras de negócio críticas (microchip único, imutabilidade de
microchip, RBAC por cargo, validações de e-mail/senha etc.). Os módulos que
ainda não têm requisições estão em [O que não está aqui](#o-que-não-está-aqui).

## Como abrir

1. No Insomnia, crie/abra um Project e escolha **Git Sync → Clone** apontando
   para este repositório (ou, se já tiver o repo clonado localmente, aponte
   o Git Sync para esta pasta). O workspace **"SISZOO API"** aparece com 9
   pastas (Health, Auth, Usuários, Preferências, Auditoria, Animais, Baias,
   Registros Clínicos, Medicamentos).
2. Selecione o Environment **"Local"** e preencha, no mínimo:
   - `admin_email` / `admin_password`: credenciais do admin seedado
     localmente (`ADMIN_SEED_EMAIL`/`ADMIN_SEED_PASSWORD` do seu `.env`).
   - `base_url`: já vem `http://localhost:8080`; ajuste se rodar em outra
     porta/host.

   **Não grave senha nem token no Environment "Local":** o arquivo
   `.insomnia/Environment/env_local.yml` é versionado, e o Git Sync levaria o
   valor para o repositório. Preencha `admin_email`, `admin_password` e `token`
   num sub-environment privado (*Private environment*), que o Git Sync não
   sincroniza, e mantenha os campos do "Local" vazios. A única senha que fica
   no "Local", `senha_teste_padrao`, é a dos usuários temporários que as
   próprias suítes criam.
3. Suba o backend (`cd backend && ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev`,
   com o banco via `docker compose up -d db` e as variáveis descritas no README da raiz).

## Uso manual (explorar/testar endpoints à mão)

Rode primeiro **Auth → Login - caso feliz**: em caso de sucesso, o token é
salvo automaticamente na variável `token` (script "After Response"), que as
demais requisições da pasta usam via header `Authorization: Bearer {{ _.token }}`.

Algumas requisições têm placeholders para preencher manualmente, como
`{{ _.usuario_id_exemplo }}`, `{{ _.animal_id_exemplo }}` e
`{{ _.baia_id_exemplo }}` - copie o `id` da resposta de um "criar"/"listar"
e cole no Environment ou direto na URL.

As requisições de criação (`Criar usuário`, `Criar animal`) usam e-mail/
microchip fixos de propósito: rodá-las uma segunda vez sem alterar esses
campos demonstra as regras de unicidade (409) - não é um bug do exemplo.

A pasta **Baias** documenta um detalhe que não é óbvio pelo nome do verbo:
"Excluir baia" é `DELETE`, mas o backend nunca remove a linha - é
soft-delete (`ativa=false`, 200), sem bloqueio mesmo com animais alocados.
Para reverter, use "Ativar/reativar baia" (`PATCH /status`).

A pasta **Registros Clínicos** (vacinações, procedimentos, prescrições) reúne
os três recursos porque compartilham o mesmo padrão de imutabilidade:
nenhum dos três controllers tem `PUT`/`PATCH`/`DELETE` - "Tentar
atualizar vacinação (405)" mostra que o Spring MVC já rejeita esses verbos
sozinho, sem código de bloqueio adicional. Correção de um registro (inclusive
mudança de status de prescrição) é sempre um novo `POST` no mesmo endpoint com
`retificaId` apontando para o registro anterior - ver "Retificar vacinação"
para o exemplo completo (o padrão é idêntico nos outros dois recursos).

A pasta **Medicamentos** cobre o catálogo `medicamento`
(criar/listar/buscar/editar/desativar). "Desativar medicamento" é soft-delete
(`ativo=false`), mesmo padrão de "Excluir baia". Para testar "Criar
medicamento" (e, por tabela, "Criar prescrição", que referencia
`medicamentoId`), é preciso o id de uma `categoria_farmacologica`: liste as
existentes com `GET /api/categorias-farmacologicas` ou crie uma com
`POST /api/categorias-farmacologicas` (endpoints ainda fora desta coleção) e
cole o uuid em {{ _.categoria_farmacologica_id_exemplo }}.

## Testes automatizados

Cada pasta `UnitTestSuite` (Auth, Usuários, Animais, Baias) roda de forma
independente e autocontida: os próprios testes criam os usuários/animais/
baias temporários de que precisam (com e-mail/microchip/nome únicos gerados
em tempo de execução), fazem login com o perfil certo e limpam-se sozinhos
por não reaproveitar dados fixos - só o `admin_email`/`admin_password` do
Environment precisa estar correto.

Para rodar: com o backend de pé, abra a aba **Unit Testing** no Insomnia,
selecione uma suíte e clique em **Run Tests**.

**Importante:** o teste `ut_usuarios_autodesativacao_admin` cobre a regra 24 do
DER: nenhum usuário desativa a própria conta (422, "Nao e permitido desativar o
proprio usuario", em `UsuarioService#alterarStatus`). O teste cria um
Administrador temporário só para isso (nunca usa o admin seedado real) e
confere que ele continua ativo depois da tentativa.

Da mesma forma, `ut_baias_excluir_soft_delete_nao_bloqueia_ocupada` documenta
que o backend não bloqueia excluir (desativar) uma baia ocupada: o único freio
é o aviso da tela de Gestão de Baias, e o teste reflete o comportamento
*atual* (200, permite; decisão AC-3 em
`docs/decisoes/animais-clinico-correcoes.md`). Já alocar um animal numa baia
sem vaga deixou de ser permitido: `ut_baias_animal_409_baia_superlotada`
espera 409 (RN-AN02, `docs/regras-negocio-clinico.md`).

## O que não está aqui

Estes endpoints já existem no backend, mas ainda não têm requisições nem
testes nesta coleção:

- **Ocorrências:** todo o módulo (`/api/ocorrencias`), inclusive anexos,
  notas, status, encerramento e estatísticas por bairro.
- **Processos sanitários:** todo o módulo (`/api/processos`), inclusive
  resultados, alterações e reenvio da notificação.
- **Dashboard e relatórios:** `/api/dashboard/kpis`, `/api/dashboard/graficos`
  e `/api/relatorios` (tipos, prévia, exportação e histórico).
- **Catálogos:** vacinas (`/api/vacinas`) e categorias farmacológicas
  (`/api/categorias-farmacologicas`).
- **Animais:** exames (`/api/exames`), anexos (`/api/animais/{id}/anexos`) e
  residentes das baias (`GET /api/baias/residentes`).
- **Alertas:** `GET /api/alertas/vacinas`.
- **Sessão e usuários:** `POST /api/auth/renovar`, `POST /api/auth/logout`,
  `PUT /api/usuarios/{id}`, `POST /api/usuarios/{id}/senha` e
  `GET /api/auditoria/filtros`.

A lista completa está nos controllers de cada pacote em
`backend/src/main/java/com/siszoo/` e na matriz de
[integracao-frontend-api.md](../integracao-frontend-api.md).
