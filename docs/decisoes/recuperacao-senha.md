# Decisões: recuperação de senha ("Esqueci minha senha")

Uma linha por decisão, no formato de `T29.md`. Origem: pedido de 01/11/2026 de um fluxo de recuperação de senha pela
tela de login, por e-mail, sem depender do Administrador. Até então a única saída para quem esquecia a senha era a
senha temporária entregue em mãos (`decisoes-funcionais.md`, "Gestão de usuários"); esse caminho continua existindo.

## Decisões

- **RS-1 (fluxo)** `POST /api/auth/recuperacao` recebe o e-mail institucional e responde `202` sempre. Se existir conta
  ativa com aquele e-mail, o backend grava um token de uso único e envia um link por e-mail. `POST
  /api/auth/recuperacao/validar` diz se o link ainda vale (`204` ou `410`). `POST /api/auth/recuperacao/redefinir`
  consome o token e grava a senha nova (`204`, `410`, `422`). As três rotas são públicas (`SecurityConfig`) e ficam
  no `AuthController`; a regra está em `RecuperacaoSenhaService`. Telas: `/esqueci-senha` e `/redefinir-senha?token=`.
- **RS-2 (sem enumeração de contas)** A resposta e o tempo de resposta não dependem de o e-mail existir, de a conta estar
  ativa nem de o formato ser institucional (o `422` de formato vale igual para qualquer endereço). O log registra o
  caso só com o e-mail mascarado (`EmailService.mascarar`). A tela repete o cuidado: "se o e-mail estiver cadastrado".
- **RS-3 (token)** 32 bytes de `SecureRandom` em Base64 URL (`TokenOpaco`, o mesmo gerador da sessão), enviados só no
  link. No banco (`token_recuperacao_senha`, V34) fica o SHA-256 em hexadecimal, com `criado_em`, `expira_em`,
  `usado_em`, `invalidado_em` e o IP da solicitação. Validade de 30 minutos (`siszoo.recuperacao-senha.validade-minutos`).
- **RS-4 (uso único e substituição)** Redefinir marca `usado_em`. Um novo pedido invalida os links pendentes do usuário
  (`invalidado_em`), assim como trocar a senha logado (`AuthService.trocarSenha`) ou receber uma senha temporária do
  Administrador (`UsuarioService.redefinirSenha`). Token vencido, usado, invalidado ou desconhecido responde o mesmo
  `410`. Conta desativada depois do pedido também não redefine.
- **RS-5 (senha nova)** Mesmas regras da troca de senha: confirmação igual, mínimo de 8 e teto de 72 bytes nos DTOs,
  `PoliticaSenha` com o e-mail e o nome do dono do token (lidos do banco) e senha diferente da atual. As recusas não
  consomem o token. A senha redefinida pelo link nunca fica temporária: `senha_alterada_em` recebe a data, mesmo para
  quem ainda não tinha feito o primeiro acesso.
- **RS-6 (sessões e auditoria)** Redefinir encerra todas as sessões do usuário com `SENHA_ALTERADA` (S-12 de
  `sessao.md`, aqui sem sessão a preservar) e grava `ATUALIZACAO` em `usuario` com `senhaAlteradaEm` antes e depois e
  `recuperacaoPorEmail: true`, nunca a senha nem o hash. A solicitação não gera evento de auditoria: o único dado seria
  o e-mail, inclusive de quem não tem conta.
- **RS-7 (limite de tentativas)** `LimitadorRecuperacaoSenha`, em memória (Caffeine, já dependência do cache do
  dashboard), por instância: 3 solicitações por e-mail e 10 por IP a cada 60 minutos; 20 validações ou redefinições por
  IP a cada 15 minutos. Excedeu, `429` com mensagem genérica. O IP é o do socket (`getRemoteAddr`), como na auditoria
  (T43): atrás de um proxy todos compartilham o limite. Não há bloqueio de conta.
- **RS-8 (e-mail)** Reaproveita `EmailService` e `EmailTemplateService` (T35) com o template `email/recuperacao-senha`
  (HTML e texto, mesmo layout da notificação de resultado): explicação do pedido, botão e link por extenso, validade e
  orientação para quem não pediu. O envio é assíncrono e só sai depois do commit da transação que gravou o token. A
  falha de envio fica no log do `EmailService`; o usuário pode pedir de novo.
- **RS-9 (link)** `siszoo.app.url` (`SISZOO_APP_URL`) + `/redefinir-senha?token=...`. Por padrão a URL é a origem do
  frontend já aceita pelo CORS (`SISZOO_CORS_ORIGIN`), então nenhuma variável nova é obrigatória.
- **RS-10 (retenção)** `RecuperacaoSenhaService.expurgarVencidos` (`@Scheduled`, 03h15 de America/Sao_Paulo) apaga os
  tokens vencidos há mais de 7 dias. Tokens usados e invalidados também vencem, então a tabela não cresce.

## Testes

- `RecuperacaoSenhaControllerIT`: fluxo completo com GreenMail (e-mail chega, link redefine uma vez, login com a senha
  nova, antiga e sessão anterior recusadas), e-mail sem conta e conta desativada (202 sem e-mail), token desconhecido e
  vencido (410), novo pedido e troca de senha invalidando o link, política de senha e confirmação (422), limite por
  e-mail (429), endpoints sem sessão.
- `RecuperacaoSenhaServiceTest` (Mockito) e `LimitadorRecuperacaoSenhaTest`.
- `MigracaoDecisoesFuncionaisIT`: V28 a V34 sobre dados existentes; unicidade do hash e cascata ao remover o usuário.
- Frontend: `EsqueciSenha.test.tsx`, `RedefinirSenha.test.tsx`, link na tela de login em `Login.test.tsx`.

## Limitações

- Limite de tentativas em memória: reiniciar o backend zera os contadores, e duas instâncias não os compartilham.
- Sem SMTP configurado, a solicitação responde `202` e o envio falha só no log. Variáveis e sandbox: `docs/email.md`.
- O e-mail precisa estar certo no cadastro; não há outro canal de recuperação além do Administrador.
