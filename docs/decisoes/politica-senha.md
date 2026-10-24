# Decisões — política de senha

Uma linha por decisão, no formato de `T29.md`. Origem: pedido de adotar as regras da política "Passwords must meet complexity requirements" do Windows (Passfilt.dll). Antes, a única regra era o mínimo de 8 caracteres (`@Size` em `CriarUsuarioRequest.senhaInicial` e `TrocarSenhaRequest.novaSenha`, e `min(8)` nos schemas do front). Regra consolidada: `docs/DER.md` §5, regra 27. Entrou na branch `feat/T43-auditoria-eventos` por decisão da equipe, em commits próprios.

## Decisões

- **PS-1 (onde vale)** A regra vale onde a senha é criada ou trocada pela API: senha inicial (`POST /api/usuarios`, campo `senhaInicial`) e troca de senha (`POST /api/auth/senha`, campo `novaSenha`). Recusa = 422 com `campos[0].campo` preenchido (`CampoInvalidoException`), no formato da validação de Bean Validation. Não vale para o login nem retroativamente: senhas já gravadas continuam entrando.
- **PS-2 (seed)** Decisão da equipe: a senha do admin do `DataSeeder` (`ADMIN_SEED_PASSWORD`, gravada sem passar pela API) não é validada. O `.env.example` passou a trazer um exemplo que cumpre a regra.
- **PS-3 (nome da conta)** O SISZOO não tem `samAccountName`; o login é o e-mail institucional. Decisão da equipe: o nome da conta é a parte do e-mail antes do `@` (ex.: `joao.silva`), checada inteira, sem diferenciar maiúsculas, e ignorada se tiver menos de 3 caracteres, como na política.
- **PS-4 (nome de exibição)** Nome de exibição = `nome` + espaço + `sobrenome` (na troca, os do usuário autenticado, lidos do banco, nunca do corpo; na criação, os do pedido; no front da criação, o "nome completo" do formulário, que o modal divide em nome e sobrenome pelo espaço). Ele é dividido em vírgula, ponto, traço/hífen (inclusive os traços Unicode U+2010–U+2015), sublinhado, espaço, cerquilha e tab. Cada parte com 3 ou mais caracteres não pode aparecer na senha, sem diferenciar maiúsculas; substrings das partes não são checadas.
- **PS-5 (categorias)** Ao menos 3 de 5: maiúsculas e minúsculas (`Character.isUpperCase`/`isLowerCase` no Java, `\p{Uppercase}`/`\p{Lowercase}` no front — incluem acentuadas, grego e cirílico); dígitos de `0` a `9` (outros dígitos Unicode não contam); símbolos da lista exata da política, ``'-!"#$%&()*,./:;?@[]^_`{|}~+<=>`` (moeda, espaço e barra invertida não contam); e letras sem maiúscula/minúscula (`Character.isAlphabetic`/`\p{Alphabetic}`, ex.: ideogramas). A barra invertida segue a lista recebida, que não a inclui.
- **PS-6 (fonte única)** `PoliticaSenha` (backend, `usuarios/service`) é a fonte da verdade; `frontend/src/features/auth/utils/politicaSenha.ts` a espelha só para a mensagem aparecer antes do envio. `PoliticaSenhaTest` e `politicaSenha.test.ts` usam os mesmos casos, para as duas implementações não divergirem.
- **PS-7 (ordem)** Na criação, as recusas existentes vêm antes (e-mail já cadastrado 409, cargo inválido, CRMV); na troca, a confirmação divergente vem antes. Mensagem: a primeira regra violada (nome da conta, partes do nome, categorias).

## Pendências

- O botão "Gerar" do modal de usuário cria `Itu@NNNN!` (`gerarSenhaAleatoria` em `CriarUsuarioModal.tsx`): cumpre a regra, mas tem só 9.000 valores possíveis e prefixo fixo. Senha inicial previsível; avaliar gerar com `crypto.getRandomValues`.
- Política de bloqueio de conta, expiração, histórico e senhas proibidas por dicionário não fazem parte da política pedida e não foram implementados.
- Senhas existentes que não cumprem a regra continuam valendo até a próxima troca; não há troca forçada.
