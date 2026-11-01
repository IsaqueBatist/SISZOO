# Decisões - auditoria dos filtros de consulta

Uma linha por decisão, no formato de `ux-auditoria.md`. Origem: auditoria dos filtros de consulta (01/11/2026), aprovada
pela equipe antes da implementação. Testes de ponta a ponta: `FiltrosDeConsultaIT`.

## Decisões

- **FC-1 Adoções e Ocupação de Baias são "Posição em dd/mm/aaaa", sem filtro de período.** O período escolhido nunca alterou esses dois relatórios: não há data de adoção nem histórico diário de ocupação. `TipoRelatorio.FiltroEsperado` trocou `JANELA` por `POSICAO`, e `GET /api/relatorios/tipos` devolve `filtro: "posicao"` nos dois. O parâmetro `janela` saiu da API.
- **FC-2 O histórico antigo fica como foi gravado.** Nada em `relatorio_gerado` foi alterado, e a seção "Relatórios recentes" mostra esses dois tipos como "Posição em" a data da geração, que é o que cada linha sempre representou. "Gerar novamente" produz a posição de hoje; período ou `janela` de um registro antigo são ignorados pelo `FiltroRelatorioResolver`.
- **FC-3 Regra única de lotação (`NivelLotacao`).** Abaixo de 80%: Normal. De 80% a 99%: Próximo do limite. 100% ou mais: Superlotada. Vale para Gestão de Baias, Dashboard e relatório (tela, PDF e CSV), com a mesma nomenclatura. A comparação não arredonda: 79,6% é Normal. Coincide com o DER §3.6; o protótipo `relatorio-ocupacao.html`, que marcava 100% como "Próx. limite", deixou de ser referência neste ponto. O frontend espelha a regra em `estadoLotacao.ts`.
- **FC-4 "Pendentes" e "Em andamento" são agrupamentos só do filtro.** Ocorrências pendentes: `ABERTA` + `EM_ATENDIMENTO`. Processos em andamento: `ABERTO`, `AGUARDANDO_RESULTADO` e `COM_RESULTADO`. Nenhum status de registro muda. `status` aceita valores separados por vírgula (`?status=ABERTA,EM_ATENDIMENTO`), e um valor só continua funcionando. Conferência com os fluxos: `ENCERRADA` e `CONCLUIDO` são os únicos estados finais; `COM_RESULTADO` exige avanço manual para `CONCLUIDO`; e a D12 já impede encerrar ocorrência com processo diferente de `CONCLUIDO`, o mesmo corte do filtro. Sem contradição.
- **FC-5 "Sob custódia" usa `GET /api/animais?custodia=true`.** A regra fica no backend (`StatusAnimal.CODIGOS_FORA_DA_CUSTODIA`, RN-A05), em vez de listar códigos na tela. O padrão das telas não mudou: todas continuam abrindo sem filtro de status.
- **FC-6 Busca sem acento e sem curingas (`BuscaTexto`).** Ignora acento e maiúscula, e `%` e `_` são caracteres comuns. Usa `translate()` do PostgreSQL, sem extensão nem migration. As buscas que rodam no navegador usam a mesma comparação (`lib/texto.ts`). Sem índice de texto: a busca por trecho já percorria a tabela, e o volume do CCZ não justifica `pg_trgm` hoje.
- **FC-7 Novos critérios nas buscas existentes, sem expor dado novo.** Animais: número da medalha, que passa a aparecer na lista. Ocorrências: endereço do fato (`ocorrencia.endereco`, nunca o endereço do denunciante) e protocolo do processo vinculado. Processos: protocolo da ocorrência vinculada e nome do animal cadastrado na amostra. Os dois protocolos já apareciam nas listas.
- **FC-8 O prefixo escolhe o protocolo.** Ocorrência e processo têm sequências independentes (D13). "PS 012/2026" acha só o processo, "OC 012/2026" só a ocorrência, e "012/2026" acha os dois.
- **FC-9 Sigilo preservado.** O denunciante de ocorrência sigilosa segue fora da busca (T26-9). A busca pelo nome do denunciado **não foi implementada**, para não ampliar a exposição de dados pessoais.
- **FC-10 Filtro por entidade removido de Logs.** Nomes técnicos, sobreposição com Módulo e combinações sempre vazias. Saiu da tela e de `GET /api/auditoria` (parâmetro `entidade` e campo `entidades` de `/filtros`). O filtro local duplicado da tela também saiu: o mapa de módulos do backend e o do frontend são iguais.
- **FC-11 Filtro que chega por link é lido uma vez e sai da URL (`useFiltroDeLink`).** Antes, `?baiaId=` voltava a valer a cada retorno da ficha, apagando a busca e a página e desfazendo "Limpar filtros". O mesmo mecanismo liga "ver todos" do alerta de urgentes a "Só urgentes". A decisão UX-1 continua: busca textual não vai para a URL.
- **FC-12 Baia inativa só aparece no filtro de Animais quando é a selecionada,** como "Nome (inativa)". O seletor continua oferecendo só baias ativas para a escolha normal.
- **FC-13 Página fora do intervalo volta para a última válida (`useManterPaginaNoIntervalo`).** Quando um registro muda de status e sai da consulta, a lista não mostra mais "Nenhum resultado" falso nem some com a paginação. Vale para Animais, Ocorrências, Processos e Logs.
- **FC-14 Desempate na ordenação.** Animais ordena por nome e `id`, e Logs por data e `id`: registros empatados não repetem nem somem entre páginas.
- **FC-15 Medicamentos carrega o catálogo inteiro.** O corte silencioso em 100 itens também afetava a prescrição. Busca e categoria filtram no navegador, porque a lista já é necessária inteira no modal da ficha.
- **FC-16 Alertas de vacina em ordem de urgência.** Quem venceu há mais tempo aparece primeiro; situação e busca filtram a tabela sem alterar os totais do resumo.
- **FC-17 Sem "filtros avançados".** Nenhuma tela passou de 5 controles, e esconder filtro atrás de um clique aumentaria o esforço.

## Melhorias futuras

- **Filtro "Retorno atrasado" em Processos: adiado.** Seria `AGUARDANDO_RESULTADO` com `previsao_retorno` vencida. Depende de a equipe preencher a previsão de forma confiável; hoje o campo é gravado, mas nada o usa. Reavaliar com dados reais de uso.
- **Bairro em Processos (RF-B02).** Não entrou na busca: o bairro vem da ocorrência vinculada, e o Veterinário não tem acesso a ocorrências por bairro (V32). Exige decisão própria.
- **Foto na listagem de Animais.** A consulta carrega `foto_url` de cada linha e a descarta. Corrigir exige projeção na listagem; tarefa separada.

## Impacto no Trabalho de Graduação

O `SISZOO_v3_final.docx` é a versão entregue e fica fora do git; não foi alterado. Se houver nova versão, estes são os trechos a revisar:

| Trecho | Texto atual | Ajuste |
|---|---|---|
| Quadro 6, RF-C04 | filtros por ação, entidade, módulo, usuário e período | Retirar "entidade" |
| Quadro 7, RF-A02 | por nome ou microchip, espécie, status e baia | Incluir medalha e a opção "sob custódia" |
| Quadro 8, RF-E02 | busca livre por protocolo, bairro ou denunciante | Incluir endereço e processo vinculado; mencionar "pendentes" |
| Quadro 9, RF-B02 | filtros por doença e status; protocolo, período, responsável e bairro como melhoria prevista | Protocolo, período e responsável estão atendidos; só bairro segue como melhoria |
| Quadro 11, Ocupação de Baias | "Ocupação atual por baia" | Descrever como posição na data da geração, com a nomenclatura da FC-3 |
| Quadro 11, Adoções | "Quantidade atual" | Descrever como posição na data da geração |
| Quadros 11 e 49 (F2-577) | ocupação por janela de 6/12 meses | Filtro por tipo passa a ser ano, período ou posição |
| Quadro 22 (F2-027) | filtros usuário, período, entidade | Trocar "entidade" por ação e módulo |
| Figuras T03, T04, T07, T08, T11 | barras de filtro anteriores | Recapturar, se o texto exigir fidelidade às telas atuais |
| Figuras T14, T20, T22 | cartões com período; "Baias no limite" | Recapturar: as telas agora mostram "Posição em" |

Os arquivos em `docs/tg/analise_fase*` registram o estado de cada fase e foram mantidos como estão.
