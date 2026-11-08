#!/bin/sh
# Atualiza o SISZOO na VM: traz os arquivos de deploy da main e as imagens que o
# workflow Deploy publicou. Só recria os containers cuja imagem ou configuração
# mudou. Executado pelo cron a cada 5 minutos (docs/deploy.md).
set -eu

trap 'status=$?; [ "$status" -eq 0 ] || echo "$(date "+%F %T") atualizacao falhou (codigo $status)" >&2' EXIT

cd "$(dirname "$0")/.."
COMPOSE="docker compose -f docker-compose.deploy.yml"

caddyfile_antes=$(git rev-parse HEAD:deploy/Caddyfile)
git pull --ff-only --quiet
caddyfile_depois=$(git rev-parse HEAD:deploy/Caddyfile)

$COMPOSE pull --quiet
$COMPOSE up -d --remove-orphans --quiet-pull

if [ "$caddyfile_antes" != "$caddyfile_depois" ]; then
    $COMPOSE exec -T caddy caddy reload --config /etc/caddy/Caddyfile
fi

docker image prune -f >/dev/null
