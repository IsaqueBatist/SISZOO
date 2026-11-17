# Deploy em servidor

Publicação do SISZOO numa VM Linux com Docker, banco PostgreSQL gerenciado fora da VM e atualização automática a
partir da `main`. Em uso desde 11/2026 numa VM Azure `Standard_B2ats_v2` (1 GB de RAM, x64) com Azure Database for
PostgreSQL Flexible Server.

## Como funciona

```
push na main ──► CI (ci.yml) ──► Deploy (deploy.yml) ──► ghcr.io/<dono>/siszoo-backend:latest
                  testes          build das imagens        ghcr.io/<dono>/siszoo-frontend:latest
                                                                       ▲
VM: cron a cada 5 min ── deploy/atualizar.sh ── git pull + docker compose pull/up ┘
```

1. O workflow [`deploy.yml`](../.github/workflows/deploy.yml) roda só depois que o CI passa num **push** na `main`
   (pull requests não publicam nada). Ele também pode ser disparado à mão em *Actions → Deploy → Run workflow*.
2. Cada imagem recebe duas tags: `latest` e `sha-<7 caracteres do commit>`.
3. A VM não recebe conexão do GitHub. O script [`deploy/atualizar.sh`](../deploy/atualizar.sh), chamado pelo cron,
   atualiza os arquivos de deploy (`git pull`), baixa as imagens e recria apenas os containers que mudaram. Se o
   `deploy/Caddyfile` mudou, o Caddy recarrega a configuração.

| Arquivo | Papel |
|---|---|
| `docker-compose.deploy.yml` | Backend e frontend a partir das imagens publicadas, Caddy com HTTPS na frente. Não sobe banco local. |
| `deploy/Caddyfile` | `/api/*` para o backend, o resto para o frontend, no mesmo domínio. Certificado emitido pelo Caddy (Let's Encrypt). |
| `deploy/atualizar.sh` | Atualização executada pelo cron. |
| `.env` (só na VM) | Senhas, chave JWT, banco, SMTP e domínio. Nunca vai para o git nem para as imagens. |

## Decisões

| Decisão | Motivo |
|---|---|
| Build no GitHub Actions, não na VM | Com 1 GB de RAM, o build do Maven e do Vite leva mais de 20 min e deixa o sistema lento. |
| VM busca as imagens (pull), GitHub não acessa a VM (push) | A porta 22 continua liberada só para o IP do administrador; nenhum segredo de acesso à VM fica no GitHub. |
| Um domínio para frontend e API | O cookie de sessão é `SameSite=Strict` e `Secure`; servir os dois na mesma origem evita CORS entre domínios. |
| `SERVER_FORWARD_HEADERS_STRATEGY=native` | Atrás do Caddy, `getRemoteAddr()` devolveria o IP do proxy para todos: o limite de falhas de login por IP (`AuthController`) passaria a valer para todos os usuários juntos e a auditoria registraria um IP só. |
| `VITE_API_BASE_URL` fixado no build da imagem | O Vite embute a variável no JavaScript; mudar o domínio exige nova imagem (variável de repositório `SISZOO_PUBLIC_URL`). |
| Limites de memória da JVM no compose | Cabe junto com nginx e Caddy em 1 GB de RAM com swap. |

## Configuração no GitHub (uma vez)

1. *Settings → Secrets and variables → Actions → Variables*: criar `SISZOO_PUBLIC_URL` com o endereço público, sem
   `/api` e sem barra no fim (ex.: `https://siszoo-tg.northcentralus.cloudapp.azure.com`). Sem a variável, o workflow
   usa esse mesmo endereço como padrão.
2. Depois da primeira execução do workflow, em *Packages* do perfil, abrir `siszoo-backend` e `siszoo-frontend` →
   *Package settings → Change visibility → Public*. As imagens não contêm segredos (o `.env` fica na VM). Se preferir
   mantê-las privadas, a VM precisa de `docker login ghcr.io` com um token de acesso pessoal com `read:packages`.

## Preparação da VM (uma vez)

Pré-requisitos: Ubuntu com Docker e o plugin Compose 2.24 ou mais recente, swap de 4 GB em VM de 1 GB, portas 80 e 443
abertas no firewall da nuvem, IP da VM liberado no firewall do PostgreSQL gerenciado e o banco `siszoo` criado.

```bash
git clone https://github.com/IsaqueBatist/SISZOO.git ~/SISZOO
cd ~/SISZOO
cp .env.example .env    # preencher conforme a tabela abaixo
docker compose -f docker-compose.deploy.yml pull
docker compose -f docker-compose.deploy.yml up -d
docker compose -f docker-compose.deploy.yml logs -f backend   # aguardar "Started SiszooBackendApplication"
```

Variáveis do `.env` que mudam em relação ao uso local (as demais estão no [README](../README.md#variáveis-de-ambiente)):

| Variável | Valor no servidor |
|---|---|
| `SISZOO_DOMINIO` | Domínio público, sem `https://` (usado pelo Caddy) |
| `DB_URL` | `jdbc:postgresql://<servidor>:5432/siszoo?sslmode=require` |
| `DB_USER`, `DB_PASSWORD` | Usuário e senha do banco gerenciado |
| `JWT_SECRET` | `openssl rand -base64 48`, gerado na própria VM |
| `ADMIN_SEED_PASSWORD` | Senha nova, nunca a do `.env.example` (só vale na primeira subida) |
| `SISZOO_CORS_ORIGIN`, `SISZOO_APP_URL` | `https://<domínio>` |
| `SISZOO_COOKIE_SECURE` | `true` |
| `SMTP_*`, `SISZOO_MAIL_FROM` | Conta de e-mail própria do sistema; ver [email.md](email.md) |
| `SISZOO_TAG` | Opcional; padrão `latest`. Use `sha-xxxxxxx` para fixar uma versão |

As variáveis `POSTGRES_*` e `VITE_API_BASE_URL` não são usadas no servidor.

### Atualização automática

```bash
chmod +x ~/SISZOO/deploy/atualizar.sh
crontab -e
```

Linha do cron (o `flock` impede duas execuções ao mesmo tempo):

```
*/5 * * * * flock -n /tmp/siszoo-atualizar.lock $HOME/SISZOO/deploy/atualizar.sh >> $HOME/siszoo-deploy.log 2>&1
```

O log só recebe linhas quando algo falha. Para atualizar na hora, sem esperar o cron: `~/SISZOO/deploy/atualizar.sh`.

## Operação

| Tarefa | Comando (em `~/SISZOO`) |
|---|---|
| Ver os containers | `docker compose -f docker-compose.deploy.yml ps` |
| Logs do backend | `docker compose -f docker-compose.deploy.yml logs -f backend` |
| Versão em execução | `docker inspect --format '{{index .Config.Labels "org.opencontainers.image.revision"}}' siszoo-backend-1` |
| Voltar a uma versão anterior | No `.env`, `SISZOO_TAG=sha-xxxxxxx`; depois `docker compose -f docker-compose.deploy.yml up -d`. Remover a linha para voltar ao `latest` |
| Aplicar mudança no `.env` | `docker compose -f docker-compose.deploy.yml up -d --force-recreate backend` |
| Backup manual do banco | `pg_dump` a partir de uma máquina liberada no firewall do banco; o serviço gerenciado também faz backup automático |

## Cuidados

- `SISZOO_TAG` fixa as duas imagens: o cron continua rodando, mas não troca a versão até a linha ser removida.
- O `git pull` do script exige que a cópia na VM não tenha alterações em arquivos versionados. Arquivos locais
  (como o `.env`) não atrapalham.
- Migrations novas rodam na subida do backend (Flyway). Uma migration com erro deixa o backend reiniciando; nesse caso,
  fixe a versão anterior com `SISZOO_TAG` e corrija na `main`.
- O `docker-compose.seed.yml` e o perfil `seed` não fazem parte do deploy. Somente dados fictícios devem existir num
  servidor acessível pela internet, e senhas documentadas no README não podem continuar válidas nele.
