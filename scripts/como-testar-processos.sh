#!/usr/bin/env bash
# Roteiro manual da T29 (processo sanitário) pela API, em bash (Linux, macOS
# ou Git Bash no Windows). Pressupõe banco novo ou recriado (a V13 não aplica
# sobre processos mínimos da T25) e o admin do seed:
#
#   ADMIN_EMAIL=... ADMIN_SENHA=... [BASE=http://localhost:8080] bash scripts/como-testar-processos.sh
#
# Cada passo confere o HTTP esperado. Qualquer resposta diferente interrompe o
# roteiro e mostra o corpo devolvido pelo servidor, então nenhum id vazio passa
# para o passo seguinte.
#
# Os corpos JSON vão pela entrada padrão (--data-binary @-), não como argumento
# do curl: no Git Bash do Windows os argumentos passam pela conversão de
# codificação do Windows e os acentos chegam ao servidor fora de UTF-8 (400);
# a entrada padrão chega com os bytes do arquivo, em UTF-8.
set -euo pipefail

BASE=${BASE:-http://localhost:8080}
: "${ADMIN_EMAIL:?defina ADMIN_EMAIL (o ADMIN_SEED_EMAIL do .env)}"
: "${ADMIN_SENHA:?defina ADMIN_SENHA (o ADMIN_SEED_PASSWORD do .env)}"
# Data local da máquina; o servidor compara com o Clock em America/Sao_Paulo.
# Não usar TZ=America/Sao_Paulo: o Git Bash não tem a base de fusos e cai em GMT.
HOJE=$(date +%F)
JSON='Content-Type: application/json'
AUTH=''

# enviar METODO ROTA < corpo — requisição que deve dar certo (HTTP < 400).
# --fail-with-body faz o curl falhar em HTTP >= 400 sem descartar o corpo, que
# é mostrado no erro. Imprime a resposta.
enviar() {
    local resposta
    if ! resposta=$(curl -sS --fail-with-body -X "$1" "$BASE$2" -H "$JSON" ${AUTH:+-H "$AUTH"} --data-binary @-); then
        echo "ERRO: $1 $2 falhou. Resposta do servidor: $resposta" >&2
        exit 1
    fi
    printf '%s\n' "$resposta"
}

# esperar CODIGO METODO ROTA < corpo — confere um HTTP específico (inclusive 422).
esperar() {
    local saida codigo corpo
    saida=$(curl -sS -w '\n%{http_code}' -X "$2" "$BASE$3" -H "$JSON" -H "$AUTH" --data-binary @-)
    codigo=${saida##*$'\n'}
    corpo=${saida%$'\n'*}
    if [ "$codigo" != "$1" ]; then
        echo "ERRO: $2 $3: esperado HTTP $1, recebido $codigo. Resposta do servidor: $corpo" >&2
        exit 1
    fi
    echo "OK  $2 $3 -> HTTP $codigo ${corpo:0:150}"
}

# valor CAMPO JSON — primeiro "CAMPO":"texto" da resposta; vazio interrompe.
valor() {
    local achado
    achado=$(printf '%s' "$2" | sed -n "s/.*\"$1\":\"\([^\"]*\)\".*/\1/p" | head -n 1)
    if [ -z "$achado" ]; then
        echo "ERRO: resposta sem \"$1\": $2" >&2
        exit 1
    fi
    printf '%s' "$achado"
}

# id da resposta: o primeiro campo do objeto de topo.
id_de() {
    local achado
    achado=$(printf '%s' "$1" | sed -n 's/^{"id":"\([^"]*\)".*/\1/p')
    if [ -z "$achado" ]; then
        echo "ERRO: resposta sem id: $1" >&2
        exit 1
    fi
    printf '%s' "$achado"
}

echo "== 0. Login"
LOGIN=$(enviar POST /api/auth/login <<EOF
{"email": "$ADMIN_EMAIL", "senha": "$ADMIN_SENHA"}
EOF
)
AUTH="Authorization: Bearer $(valor token "$LOGIN")"

echo "== 1. Processo completo com amostra de animal de campo (sem vínculo)"
# Esperado: urgente=true (contato humano), cid "A82", 2 sintomas.
enviar POST /api/processos <<EOF
{
  "dataAbertura": "$HOJE", "doenca": "raiva", "laboratorio": "pasteur_sp",
  "responsavel": {"nome": "Maria da Conceição", "telefone": "(11) 99999-0000", "bairroOcorrencia": "Jardim São José"},
  "amostras": [{
    "especie": "canino", "sexo": "macho", "raca": "SRD",
    "statusClinico": "SINTOMATICO", "tipoAbrigo": "PERIDOMICILIAR",
    "dataColeta": "$HOJE", "materialBiologico": "SORO",
    "contatoHumano": true, "nivelContato": "DIRETA", "agrediuHumano": true,
    "alteracaoComportamental": "Agressão sem motivo aparente",
    "sintomas": ["apatia", "alt_comportamental"]
  }]
}
EOF

echo "== 2. Processo com amostra de animal do canil (identificação copiada da ficha)"
# Esperado: espécie, sexo, raça e peso da amostra vêm da ficha (felino, femea, SRD, 4.20).
ANIMAL=$(enviar POST /api/animais <<EOF
{
  "nome": "Pipoca", "especie": "felino", "sexo": "femea", "raca": "SRD", "pesoKg": 4.2,
  "esterilizado": false, "status": "em_quarentena", "motivoEntrada": "resgate",
  "dataEntrada": "${HOJE}T08:00:00"
}
EOF
)
ANIMAL_ID=$(id_de "$ANIMAL")
enviar POST /api/processos <<EOF
{
  "dataAbertura": "$HOJE", "doenca": "esporotricose", "laboratorio": "ial_sorocaba",
  "responsavel": {"nome": "CCZ Itu"},
  "amostras": [{
    "animalId": "$ANIMAL_ID",
    "statusClinico": "ASSINTOMATICO", "tipoAbrigo": "INTRADOMICILIAR",
    "dataColeta": "$HOJE", "materialBiologico": "SANGUE", "contatoHumano": false
  }]
}
EOF

echo "== 3. Processo vinculado a uma ocorrência (etapa 1)"
OCORRENCIA=$(enviar POST /api/ocorrencias <<EOF
{
  "tipoOcorrencia": "zoonose", "dataAbertura": "$HOJE", "endereco": "Rua São Paulo, 1",
  "bairro": "Centro", "descricao": "Cão com suspeita de raiva",
  "denunciante": {"nome": "João Souza"}
}
EOF
)
OCORRENCIA_ID=$(id_de "$OCORRENCIA")
PROCESSO=$(enviar POST /api/processos <<EOF
{
  "dataAbertura": "$HOJE", "doenca": "raiva", "laboratorio": "pasteur_sp",
  "ocorrenciaId": "$OCORRENCIA_ID",
  "responsavel": {"nome": "Maria da Conceição"},
  "amostras": [{
    "especie": "canino", "sexo": "macho",
    "statusClinico": "OBITO", "tipoAbrigo": "PERIDOMICILIAR",
    "dataColeta": "$HOJE", "materialBiologico": "TECIDO_ENCEFALICO", "contatoHumano": false
  }]
}
EOF
)
PROCESSO_ID=$(id_de "$PROCESSO")
VINCULO=$(valor ocorrenciaId "$PROCESSO")
if [ "$VINCULO" != "$OCORRENCIA_ID" ]; then
    echo "ERRO: processo vinculado a $VINCULO, esperado $OCORRENCIA_ID" >&2
    exit 1
fi
echo "OK  processo $PROCESSO_ID vinculado à ocorrência $OCORRENCIA_ID"

echo "== 4. Avançar o status do processo até CONCLUIDO (provisório, D18: um passo por vez)"
esperar 200 PATCH "/api/ocorrencias/$OCORRENCIA_ID/status" <<< '{"status": "EM_ATENDIMENTO"}'
# D12: com o processo vinculado não concluído, o encerramento é recusado.
esperar 422 POST "/api/ocorrencias/$OCORRENCIA_ID/encerramento" <<< '{"providenciaTomada": "abertura_processo"}'
for STATUS in AGUARDANDO_RESULTADO COM_RESULTADO CONCLUIDO; do
    esperar 200 PATCH "/api/processos/$PROCESSO_ID/status" <<< "{\"status\": \"$STATUS\"}"
done

echo "== 5. Encerrar a ocorrência (D12: liberado com o processo CONCLUIDO)"
esperar 200 POST "/api/ocorrencias/$OCORRENCIA_ID/encerramento" <<< '{"providenciaTomada": "abertura_processo"}'

echo "Roteiro concluído sem erros."
