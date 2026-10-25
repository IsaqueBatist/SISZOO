# Pedido — `endereco` em ProcessoResumoResponse / lista de valores distintos

Status: **pendente** (melhoria de prioridade baixa; registrada no alinhamento com o TG como B-08 em
`docs/tg/analise_fase3/bloqueios.md`). As sugestões de **bairro** já vêm de `GET /api/ocorrencias/estatisticas/bairro`
(T45); o `endereco` continua sem sugestão.

## Contexto

O campo "Endereço" do formulário de ocorrência (`frontend/src/features/ocorrencias/components/OcorrenciaForm.tsx`)
é texto livre, sem nenhuma ajuda ao digitar — cada erro de digitação cria um
valor diferente para o mesmo endereço real.

Para o campo "Bairro" já foi possível reduzir isso com um `<datalist>`
sugerindo bairros já usados (`useSugestoesBairroQuery`,
`frontend/src/features/ocorrencias/hooks/useSugestoesBairro.ts`), porque
`GET /api/ocorrencias` (listagem) já devolve `bairro` em cada item
(`OcorrenciaResumoResponse`).

**`endereco` não está nesse DTO de resumo** — só o detalhe completo
(`GET /api/ocorrencias/{id}`) tem. Buscar o detalhe de cada ocorrência da
listagem só para montar uma lista de sugestão seria 1 requisição por
ocorrência (N+1), inviável.

## Pedido

Uma das duas opções (qualquer uma resolve):

1. Incluir `endereco` em `OcorrenciaResumoResponse` (mesmo DTO que já tem
   `bairro`).
2. Um endpoint de valores distintos, ex. `GET /api/ocorrencias/enderecos`,
   devolvendo só a lista de strings já usadas (mais barato que trazer o
   resumo inteiro).

Enquanto isso não existir, o campo "Endereço" continua sem sugestão — só o
campo "Bairro" tem.
