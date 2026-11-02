# Conformidade legal - decisões da auditoria de 02/11/2026

Implementação dos itens da auditoria estática de conformidade sobre `b6d7209`
(branch `feat/conformidade-auditoria`, um commit por item). Este arquivo registra o
que o prompt da auditoria pedia e o código contradizia, as decisões tomadas e os
pontos que continuam em aberto com o CCZ.

## Divergências entre o prompt e o código

- **Numeração das migrations.** O prompt citava `V24` como a última; o repositório
  estava na `V34` (a `V24` é a do `laudo_eutanasia`). As novas seguem da `V35`.
- **TODOs no código.** O prompt pedia `TODO` para os critérios ainda não definidos
  pelo CCZ (itens 2 e 3). O código do SISZOO não leva comentários (decisão da equipe
  de 02/11/2026); os pontos em aberto ficam neste arquivo e em
  `docs/regras-negocio-clinico.md` (pendentes).
- **Liberar a vaga na baia ao transferir (item 4).** Não há liberação explícita: a
  ocupação é calculada pelos status fora da custódia
  (`StatusAnimal.CODIGOS_FORA_DA_CUSTODIA`), que já incluem `transferido`.
- **Ocorrência encerrada não se edita** (`Ocorrencia#exigirAberta`), mas o animal
  costuma ser cadastrado no canil depois do encerramento com "Captura e remoção".
  Decisão no item 3, abaixo.

## Item 1 - castração marca o animal como esterilizado

RN-AN05 em `docs/regras-negocio-clinico.md`. A retificação de uma castração não
desfaz a marcação: o animal continua esterilizado, e uma correção da ficha é feita
pela edição do animal, que gera a própria auditoria.

## Item 2 - alerta de esterilização após 72 horas

Base: Lei estadual nº 12.916/2008, art. 5º. Regra em `docs/contratos/dashboard-kpis.md`
(`esterilizacao_72h`).

- `esterilizado = NULL` (não informado) não entra, como em `nao_castrado`; o prompt
  pedia `esterilizado = false`.
- **Em aberto com o CCZ:** animais em tratamento ou apreendidos devem ficar fora do
  alerta? Hoje entram todos os não esterilizados sob custódia.

## Item 3 - vínculo entre ocorrência e animal recolhido

Base: Portaria MS nº 1.138/2014, inc. X (rastreabilidade solicitação, recolhimento,
animal). Coluna `ocorrencia.animal_id` (V35), regra no DER §3.3.

- **1:1 por enquanto.** Índice único em `animal_id`: uma ocorrência aponta para no
  máximo um animal e um animal tem no máximo uma ocorrência de origem. Ninhada
  (vários animais por ocorrência) vira tabela N:N se o CCZ precisar; a resposta de
  `GET /api/animais/{id}/origem` já é uma lista.
- **Vínculo em ocorrência encerrada (decisão da equipe em 02/11/2026).** Permitido
  como exceção auditada, com estas condições: só `animal_id`, nenhum outro campo; só
  se ainda estiver vazio (uma vez, sem troca); mesma permissão de quem edita
  ocorrência (`OCORRENCIAS_DENUNCIAS:escrita`); auditoria `ATUALIZACAO` com antes e
  depois; ocorrência sigilosa continua mascarada. Motivo: nenhuma norma proíbe, a
  regra de imutabilidade é do projeto ("só atualizado com log") e, sem a exceção, a
  maioria das ocorrências de recolhimento ficaria sem animal no uso real. Em
  ocorrência aberta ou em atendimento o animal pode ser trocado.
- **Frontend.** O vínculo é feito no card "Animal recolhido" do detalhe da
  ocorrência (busca por nome ou microchip, reaproveitando `BuscaAnimalCanil`); a
  API também aceita `animalId` na criação. A ficha do animal mostra a seção
  "Origem": em ocorrência sigilosa só o protocolo; para quem não acessa o módulo de
  ocorrências (Veterinário, V11), o protocolo aparece sem link.
- **Em aberto com o CCZ:** se preferem mudar o fluxo e cadastrar o animal antes de
  encerrar (decisão de processo deles; o sistema não força); se uma ocorrência pode
  gerar mais de um animal recolhido (ninhada).

## Item 4 - destino da transferência

Base: Portaria MS nº 1.138/2014, inc. XIII; Lei estadual nº 11.977/2005, art. 31
(proíbe enviar animais do CCZ para experimentação; sem destino registrado isso não é
demonstrável). Colunas em `animal` (V36), regra RN-AN06.

- **Imutabilidade no serviço.** O projeto não tem mecanismo genérico de
  imutabilidade por campo nem "novo registro" para a ficha do animal. A transferência
  registrada é protegida em `AnimalService#exigirTransferenciaInalterada`: tipo,
  destino e data não mudam (422); o documento pode ser preenchido uma vez, se ficou
  em branco, como o microchip. A correção de um erro fica pendente com o CCZ.
- **Vaga da baia.** Nada novo: `transferido` já está fora da custódia.
- **Adoção fora do escopo.** Não há tipo de destino "adotante".
- **Animais já transferidos antes da V36** continuam válidos sem destino; o
  formulário pede o destino quando um deles é editado.
- **Documento.** Texto livre (número do ofício ou nome do anexo); o arquivo vai nos
  anexos da ficha (`anexo_animal`), sem vínculo de chave.
- **Em aberto com o CCZ:** lista de destinos usados na prática; como corrigir uma
  transferência registrada com erro; o que fazer quando um animal transferido volta
  ao CCZ (hoje o status pode mudar e o destino gravado permanece).
