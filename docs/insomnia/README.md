# Coleção Insomnia — SISZOO

A pasta `.insomnia/` na raiz do repositório é uma coleção do
[Insomnia](https://insomnia.rest/) sincronizada via Git ("Git Sync"), com
todos os endpoints REST do backend documentados como requisições de exemplo,
além de suítes de testes automatizados (`insomnia.send()` + `chai`) que
verificam as regras de negócio críticas do projeto (microchip único,
imutabilidade de microchip, RBAC por cargo, validações de e-mail/senha etc.).

## Como abrir

1. No Insomnia, crie/abra um Project e escolha **Git Sync → Clone** apontando
   para este repositório (ou, se já tiver o repo clonado localmente, aponte
   o Git Sync para esta pasta). O workspace **"SISZOO API"** aparece com 8
   pastas (Health, Auth, Usuários, Preferências, Auditoria, Animais, Baias,
   Registros Clínicos).
2. Selecione o Environment **"Local"** e preencha, no mínimo:
   - `admin_email` / `admin_password`: credenciais do admin seedado
     localmente (`ADMIN_SEED_EMAIL`/`ADMIN_SEED_PASSWORD` do seu `.env`).
   - `base_url`: já vem `http://localhost:8080`; ajuste se rodar em outra
     porta/host.
3. Suba o backend (`cd backend && mvn spring-boot:run`, com o banco via
   `docker compose up`).

## Uso manual (explorar/testar endpoints à mão)

Rode primeiro **Auth → Login - caso feliz**: em caso de sucesso, o token é
salvo automaticamente na variável `token` (script "After Response"), que as
demais requisições da pasta usam via header `Authorization: Bearer {{ _.token }}`.

Algumas requisições têm placeholders para preencher manualmente, como
`{{ _.usuario_id_exemplo }}`, `{{ _.animal_id_exemplo }}` e
`{{ _.baia_id_exemplo }}` — copie o `id` da resposta de um "criar"/"listar"
e cole no Environment ou direto na URL.

As requisições de criação (`Criar usuário`, `Criar animal`) usam e-mail/
microchip fixos de propósito: rodá-las uma segunda vez sem alterar esses
campos demonstra as regras de unicidade (409) — não é um bug do exemplo.

A pasta **Baias** documenta um detalhe que não é óbvio pelo nome do verbo:
"Excluir baia" é `DELETE`, mas o backend nunca remove a linha — é
soft-delete (`ativa=false`, 200), sem bloqueio mesmo com animais alocados.
Para reverter, use "Ativar/reativar baia" (`PATCH /status`).

A pasta **Registros Clínicos** (vacinações, procedimentos, prescrições) reúne
os três recursos porque compartilham o mesmo padrão de imutabilidade
(CLAUDE.md): nenhum dos três controllers tem `PUT`/`PATCH`/`DELETE` — "Tentar
atualizar vacinação (405)" mostra que o Spring MVC já rejeita esses verbos
sozinho, sem código de bloqueio adicional. Correção de um registro (inclusive
mudança de status de prescrição) é sempre um novo `POST` no mesmo endpoint com
`retificaId` apontando para o registro anterior — ver "Retificar vacinação"
para o exemplo completo (o padrão é idêntico nos outros dois recursos). Um
detalhe que só aparece testando: `medicamentoId` (usado por "Criar
prescrição") não tem seed nem endpoint de catálogo ainda — é preciso inserir
uma `categoria_farmacologica`/`medicamento` direto no banco antes de testar
esse endpoint (ver descrição da requisição).

## Testes automatizados

Cada pasta `UnitTestSuite` (Auth, Usuários, Animais, Baias) roda de forma
independente e autocontida: os próprios testes criam os usuários/animais/
baias temporários de que precisam (com e-mail/microchip/nome únicos gerados
em tempo de execução), fazem login com o perfil certo e limpam-se sozinhos
por não reaproveitar dados fixos — só o `admin_email`/`admin_password` do
Environment precisa estar correto.

Para rodar: com o backend de pé, abra a aba **Unit Testing** no Insomnia,
selecione uma suíte e clique em **Run Tests**.

**Importante:** o teste `ut_usuarios_autodesativacao_admin` documenta um gap
encontrado no código — hoje não existe nenhuma regra que impeça um
Administrador de desativar a própria conta. O teste cria um Administrador
temporário só para isso (nunca usa o admin seedado real), e a asserção
reflete o comportamento *atual* (200, permite). Se a equipe decidir bloquear
essa ação no futuro, o teste precisa ser atualizado para esperar o novo
status.

Da mesma forma, `ut_baias_excluir_soft_delete_nao_bloqueia_ocupada` e
`ut_baias_animal_pode_ser_alocado_em_baia_superlotada` documentam dois gaps
equivalentes no módulo de baias: o backend nem bloqueia excluir uma baia
ocupada, nem impede alocar um animal numa baia já superlotada — os dois
únicos freios existentes são de UI (aviso ao excluir, `<option disabled>` no
formulário de animal), na tela de Gestão de Baias e no formulário de animal
respectivamente. Ambos os testes refletem o comportamento *atual* (200,
permite); se essas regras migrarem para o backend no futuro, os testes
precisam ser atualizados para esperar 409/422.

## O que não está aqui

Os módulos `ocorrencias`, `processos` e `relatorios` ainda não têm código no
backend (só scaffolding de pastas) — por isso não têm requisições nem testes
nesta coleção. Adicionar aqui conforme os endpoints forem implementados.
