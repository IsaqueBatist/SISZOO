# Coleção Insomnia - SISZOO

A pasta `.insomnia/` na raiz do repositório é uma coleção do
[Insomnia](https://insomnia.rest/) sincronizada via Git ("Git Sync"). Ela cobre
**os 86 endpoints do backend** com **133 requisições** em 17 pastas, numa ordem
que pode ser executada do começo ao fim:

- cada requisição de criação guarda o id gerado no Environment, e as seguintes o
  reutilizam; nenhuma depende de id fixo de um banco;
- além dos casos de sucesso, há 36 cenários de erro: sem autenticação, sem
  permissão, dados inválidos, recurso inexistente, conflitos e regras de negócio;
- toda requisição tem um teste de status no "After Response Script".

Há também quatro suítes de testes de regras de negócio (`UnitTestSuite`: Auth,
Usuários, Animais e Baias).

## Como abrir

1. No Insomnia, crie ou abra um Project e escolha **Git Sync → Clone** apontando
   para este repositório (ou aponte o Git Sync para a pasta já clonada). O
   workspace **"SISZOO API"** aparece com as 17 pastas descritas abaixo.
2. Selecione o Environment **"Local"**. `base_url` já vem `http://localhost:8080`.
3. Crie um sub-environment privado (*Private environment*) e preencha nele:
   - `admin_email` e `admin_password`: a conta de administrador que vai rodar a
     coleção;
   - `admin_password_nova`: só se for o primeiro acesso dessa conta (veja
     "Primeiro acesso").

   **Não grave senha nem token no Environment "Local":** o arquivo
   `.insomnia/Environment/env_local.yml` é versionado, e o Git Sync levaria o
   valor para o repositório. O Private environment não é sincronizado. As senhas
   que ficam no "Local" (`senha_teste_padrao` e `senha_teste_nova`) são fictícias
   e servem só aos usuários de teste que a própria coleção cria.
4. Suba o backend. Qualquer forma do [README da raiz](../../README.md) serve; a
   mais completa para explorar é o ambiente com dados fictícios
   (`docker compose -f docker-compose.yml -f docker-compose.seed.yml up --build`).

### Primeiro acesso

Uma conta recém-criada precisa trocar a senha antes de usar a API (até lá, as
demais rotas respondem 403). Com o administrador criado por `ADMIN_SEED_EMAIL`
num banco novo:

1. preencha `admin_password` com a senha atual e `admin_password_nova` com a nova;
2. rode **02 - Auth → Login - caso feliz** e, em seguida,
   **Trocar a própria senha (primeiro acesso)**. A coleção passa a usar a nova
   senha em `admin_password`.

Se a conta já trocou a senha (por exemplo, `marta.siqueira.seed@itu.sp.gov.br`
no ambiente de dados fictícios, senha `Ficticio#2026`), pule essa requisição.

## Como executar

Rode as pastas na ordem, a partir de **02 - Auth → Login - caso feliz**. O
login guarda o token em `token` e gera um sufixo novo em `execucao`, usado nos
dados que o banco exige únicos (e-mails, microchip, nome da vacina e da
categoria). Por isso a sequência pode ser repetida no mesmo banco.

| Pasta | O que cobre |
|---|---|
| 01 - Health | Verificação de saúde |
| 02 - Auth | Login, troca de senha do primeiro acesso, recuperação de senha, 401 sem token, com token inválido e com senha errada |
| 03 - Usuários | Listar, criar, editar, redefinir senha, ativar ou desativar, meu perfil; e-mail fora do padrão, e-mail repetido e veterinário sem CRMV |
| 04 - Perfis para testes de permissão | Cria um veterinário e um agente sanitário fictícios, faz o primeiro acesso de cada um e guarda os tokens; 403 de usuários e de auditoria |
| 05 - Preferências | Tema, densidade e notificações do usuário logado |
| 06 - Auditoria | Trilha de auditoria e opções de filtro |
| 07 - Baias | CRUD, residentes, exclusão lógica e reativação; capacidade inválida, baia inexistente e agente sem permissão |
| 08 - Animais | CRUD, catálogos e anexos; campos obrigatórios, microchip repetido, animal inexistente, agente sem permissão e cadastro pelo veterinário |
| 09 - Catálogos clínicos | Vacinas e categorias farmacológicas; nome repetido, intervalo inválido e agente sem permissão |
| 10 - Medicamentos | CRUD e desativação; sem categoria e veterinário sem permissão para desativar |
| 11 - Registros clínicos | Vacinações, procedimentos, prescrições e exames; retificação dupla, data futura e o 405 da imutabilidade |
| 12 - Alertas | Reforço vacinal |
| 13 - Ocorrências | Catálogos, registro (identificada e anônima), filtros, edição, status, notas, anexos e estatística por bairro; sem endereço, inexistente e veterinário sem acesso |
| 14 - Processos sanitários | Abertura, edição pelo administrador com histórico, status, resultado, reenvio de notificação e conclusão; sem amostras, salto de status e veterinário sem permissão para editar |
| 15 - Ocorrências: vínculo e encerramento | Vínculo de processo a uma ocorrência, recusa de encerramento com processo em aberto e encerramento |
| 16 - Dashboard e relatórios | KPIs, gráficos, tipos, prévias, exportação em CSV e PDF e histórico; formato inválido |
| 17 - Sessão | Renovação do token pelo cookie de sessão e logout (rode por último); renovação sem o cabeçalho de sessão |

Os cenários de erro têm o status esperado no nome (por exemplo,
"403 - agente não cria baia"). Os de permissão usam os tokens da pasta 04
(`token_veterinario` e `token_agente`); os de recurso inexistente usam
`id_inexistente`, um UUID que nunca é gerado.

### Variáveis do Environment

| Variável | Preenchida por |
|---|---|
| `base_url` | Você (padrão `http://localhost:8080`) |
| `admin_email`, `admin_password`, `admin_password_nova` | Você, no Private environment |
| `token`, `execucao`, `execucao_letras` | Login do administrador |
| `token_veterinario`, `token_agente` | Pasta 04 |
| `senha_teste_padrao`, `senha_teste_nova`, `id_inexistente` | Já vêm no Environment (valores fictícios) |
| `*_id_exemplo` (`usuario_id_exemplo`, `animal_id_exemplo`, `ocorrencia_id_exemplo`, `processo_id_exemplo` etc.) | Requisições de criação. Para usar um registro existente, substitua o valor |

### Comportamentos que a coleção demonstra

- **Imutabilidade:** registros clínicos e resultados laboratoriais não têm
  `PUT`/`PATCH`/`DELETE`. "Tentar atualizar vacinação" espera 405; a correção é
  um novo `POST` com `retificaId`, e um registro só pode ser retificado uma vez.
- **Exclusão lógica:** "Excluir baia", "Desativar vacina" e "Desativar
  medicamento" marcam o registro como inativo (200); a baia é reativada logo em
  seguida por `PATCH /status`.
- **Permissões:** o Veterinário cadastra animais, mas não acessa ocorrências, não
  gerencia usuários e não desativa catálogos; o Agente Sanitário só consulta
  animais e baias. A edição do registro de processo é exclusiva do Administrador.
- **Fluxo do processo:** o status avança um passo por vez
  (ABERTO → AGUARDANDO_RESULTADO; COM_RESULTADO ao registrar o resultado;
  CONCLUIDO). O resultado positivo é definitivo e dispara a notificação ao
  munícipe; sem SMTP configurado, o envio só falha no log.
- **Encerramento da ocorrência:** com processo vinculado, ele precisa estar
  concluído; a partir de ABERTA, só as providências de encerramento direto.
- **Sessão:** `renovar` e `logout` usam o cookie gravado no login e exigem o
  cabeçalho `X-SISZOO-Sessao` (sem ele, 403), já configurado nas requisições.
- **Anexos:** os envios usam `backend/src/main/resources/seed/fotos/001-thor.jpg`
  (foto CC0 do repositório). Se o Insomnia não localizar o caminho relativo,
  selecione o arquivo de novo no campo `arquivo`.
- **Limite de tentativas:** "202 - solicitar recuperação de senha" passa a
  responder 429 se a coleção for executada várias vezes em poucos minutos. É a
  regra de limite por e-mail e por IP; aguarde alguns minutos.

## Testes automatizados (Unit Testing)

Cada `UnitTestSuite` (Auth, Usuários, Animais, Baias) é independente: os testes
criam os usuários, animais e baias temporários de que precisam (com e-mail,
microchip e nome únicos gerados em tempo de execução), fazem login com o perfil
certo e conferem as regras, inclusive o RBAC por cargo. Só `admin_email` e
`admin_password` precisam estar corretos.

Para rodar: com o backend de pé, abra a aba **Unit Testing** no Insomnia,
selecione uma suíte e clique em **Run Tests**.

- `ut_usuarios_autodesativacao_admin` cobre a regra 24 do DER: nenhum usuário
  desativa a própria conta (422). O teste cria um Administrador temporário e
  confere que ele continua ativo.
- `ut_baias_excluir_soft_delete_nao_bloqueia_ocupada` documenta que o backend
  não bloqueia desativar uma baia ocupada (decisão AC-3 em
  `docs/decisoes/animais-clinico-correcoes.md`), e
  `ut_baias_animal_409_baia_superlotada` espera 409 ao alocar um animal numa
  baia sem vaga (RN-AN02, `docs/regras-negocio-clinico.md`).

## Validação da coleção

Em 02/11/2026 as 133 requisições foram executadas contra um backend real
(perfil `dev`, PostgreSQL 16 em banco vazio), lendo os arquivos `.insomnia/`
como estão no repositório, com a mesma resolução de variáveis `{{ _.x }}`, a
mesma API de scripts (`insomnia.response.code`, `insomnia.environment`,
`insomnia.test` e `insomnia.expect`) e o envio de cookies do Insomnia:

| Execução | Resultado |
|---|---|
| Banco vazio, primeiro acesso do administrador | 133 de 133 com o teste de status aprovado |
| Mesmo banco, nova execução | 133 de 133 |

Nos 36 cenários de erro, além do status, a mensagem devolvida pela API foi
conferida para garantir que cada um falha pela regra que pretende mostrar (por
exemplo, o 403 de permissão e o 403 da senha temporária têm mensagens
diferentes).

Os 86 endpoints foram executados com o resultado esperado; 84 deles também no
caminho de sucesso. As exceções são `POST /api/auth/recuperacao/validar` e
`POST /api/auth/recuperacao/redefinir`: a coleção cobre só o token inválido
(410), porque o token válido chega por e-mail. Para testar o caminho completo,
configure um SMTP sandbox (veja [docs/email.md](../email.md)) e copie o token do
link recebido.

A execução não usou o aplicativo do Insomnia, e as suítes de Unit Testing não
foram executadas nessa validação; elas rodam no Insomnia, como descrito acima.
