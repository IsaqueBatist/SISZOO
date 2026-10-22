# Pendências para a equipe — divergências da auditoria de regras de negócio

Classificação provisória de cada divergência da seção 11.5 do relatório de auditoria, mais as que surgiram nas correções (`docs/decisoes/auditoria-rn.md`). Este documento **não decide nada**: registra a evidência, uma classificação provisória e a pergunta que a equipe precisa responder.

**Fontes.** DOCX = `SISZOO_rodada2_realce.docx` e `SISZOO_rodada2_realce (1).docx` (fora do repositório, em `Downloads`; o Quadro 13 é igual nas duas cópias). Código e DER = estado de `main` em `5b122b6`, salvo indicação.

**Classificações.** *Erro de implementação*: o código contraria uma regra sem registro de decisão em contrário. *Documentação desatualizada*: há decisão registrada, com data ou motivo, e um documento ficou para trás. *Decisão em aberto*: as fontes divergem e nenhuma registra qual prevalece. *Evidência insuficiente*: não dá para classificar com o que existe no repositório.

## Resumo

| # | Tema | Classificação provisória |
|---|---|---|
| D1 | Microchip obrigatório no cadastro | Documentação desatualizada (premissa do pedido da auditoria) |
| D2 | Quadro das regras de negócio | Documentação desatualizada (referência do pedido) |
| D3 | Formato do protocolo | Decisão em aberto |
| D4 | Quem vê o denunciante sigiloso | Decisão em aberto |
| D5 | Quando a ocorrência pode ser encerrada | Decisão em aberto |
| D6 | Porte e baia obrigatórios no animal | Baia: decisão em aberto · porte: evidência insuficiente |
| D7 | Endereço do responsável obrigatório | Evidência insuficiente |
| D8 | Matriz de acesso (RN09) | Decisão em aberto |
| D9 | Resultado inconclusivo notifica? | Documentação desatualizada (DOCX) — fechada pela decisão T34-4 |
| D10 | Estados do processo | Decisão em aberto |
| D11 | Fuso dos timestamps | Evidência insuficiente |
| D12 | CPF do responsável único | Documentação desatualizada (DOCX), a confirmar |
| D13 | Fonte da correção da V11 | Documentação desatualizada (incompleta) |
| D14 | DBML do módulo 4 | Documentação desatualizada |
| N1 | Microchip: maiúsculas e minúsculas | Decisão em aberto |
| N2 | Microchip em criação simultânea | Decisão em aberto |
| N3 | Cargos no token | Decisão em aberto |
| N4 | `VISUALIZACAO` na recarga após mutação | Decisão em aberto |
| N5 | Baia apagada ao restaurar rascunho (opções de baia tardias) | Erro de implementação + decisão em aberto |

## Divergências da seção 11.5

### D1 — Microchip obrigatório no cadastro
- **Evidência.** O pedido da auditoria dizia que o DOCX exige o microchip. O DOCX atual diz o contrário: RN01 ("O animal que chega sem microchip é cadastrado e recebe o chip no CCZ"), RN07 ("O microchip é obrigatório para a ficha ser considerada completa, não para o cadastro de entrada") e RF-A01 ("O animal pode ser cadastrado sem microchip"). DER §3.2 (`microchip` opcional, único quando informado), V4/V16 (coluna nula) e `CriarAnimalRequest` (sem `@NotBlank`) seguem o DOCX.
- **Classificação provisória.** Documentação desatualizada — na premissa do pedido, não no sistema.
- **Pergunta.** O texto atual do DOCX (microchip opcional na entrada) é o oficial?
- **Impacto.** Se sim: nada muda. Se o microchip passar a ser obrigatório na entrada: animais sem chip deixam de poder ser cadastrados; os 15 animais sem microchip do banco de desenvolvimento ficam fora da regra.

### D2 — Quadro das regras de negócio
- **Evidência.** O pedido citava o Quadro 7; no DOCX, as regras estão no Quadro 13 ("Regras de negócio do SISZOO"); o Quadro 7 são os RFs do Módulo 2.
- **Classificação provisória.** Documentação desatualizada (referência).
- **Pergunta.** Nenhuma de produto; só corrigir a referência onde ela aparecer.

### D3 — Formato do protocolo
- **Evidência.** DOCX RN02, RF-E01 e RF-B01: `0000/AAAA`, "reiniciando em 0001". DER §3.4 e §3.5 e decisão D13 (`docs/decisoes/T25-T26.md`): `NNN/AAAA`, crescendo acima de 999. Código: `ProtocoloService.proximo` formata com `%03d` (`001/2026`). Não há registro de qual fonte prevalece.
- **Classificação provisória.** Decisão em aberto.
- **Pergunta.** O protocolo oficial tem 3 ou 4 dígitos?
- **Impacto.** 3 dígitos: atualizar o DOCX. 4 dígitos: mudar o formato no servidor e nos testes; os protocolos já emitidos continuam com 3 dígitos (`001/2026` ao lado de `0001/2026`); a busca e a exibição precisam aceitar os dois formatos; a unicidade é por texto, então os dois formatos não colidem entre si.

### D4 — Quem vê o denunciante sigiloso
- **Evidência.** DOCX RN03: "não são exibidos para nenhum perfil exceto Administrador". Decisão D6 (`T25-T26.md`), DER §3.1 e regra 11, V10 (feature `denunciante_sigiloso` para Administrador e Agente Sanitário) e testes (`OcorrenciaControllerIT#sigiloPorPerfil`, `RbacMatrixIT`): Administrador e Agente. A D6 tem motivo registrado ("quem registra e atende a ocorrência precisa ver o denunciante"), mas não há registro de que o DOCX tenha sido revisto.
- **Classificação provisória.** Decisão em aberto — dado pessoal sensível (LGPD).
- **Pergunta.** O Agente Sanitário deve ver os dados do denunciante de ocorrência sigilosa?
- **Impacto.** Sim (manter D6): atualizar RN03 no DOCX e registrar a base para o acesso. Não: migration nova retirando a feature do cargo, ajuste dos testes que fixam o acesso do Agente; o Agente passa a receber a máscara no detalhe e 403 nos anexos de sigilosa. O efeito disso no atendimento (o Agente registra e atende a ocorrência) não tem evidência no repositório.

### D5 — Quando a ocorrência pode ser encerrada
- **Evidência.** DOCX RN05: "só pode ser encerrada depois de registrado o resultado desse processo". DER regra 13 e D12: só com o processo vinculado em `CONCLUIDO`. Código: `OcorrenciaService.encerrar` recusa (422) se o processo não está `CONCLUIDO`. O processo pode ter resultado registrado e ainda estar em `COM_RESULTADO`.
- **Classificação provisória.** Decisão em aberto.
- **Pergunta.** Basta o resultado registrado, ou o processo precisa estar concluído?
- **Impacto.** Basta o resultado: aceitar `COM_RESULTADO` no encerramento; a ocorrência pode fechar antes do processo. Concluído: atualizar RN05 no DOCX.

### D6 — Porte e baia obrigatórios no animal
- **Evidência.** DOCX RN07: espécie, sexo, **porte**, **baia**, esterilizado, status, motivo e data de entrada obrigatórios. DER §3.2: `porte` e `baia_id` opcionais ("NULL se em trânsito"). V4: as duas colunas nulas. `CriarAnimalRequest`/`AtualizarAnimalRequest`: sem `@NotNull` em porte e baia. Comentário em `frontend/src/features/animais/schemas/animalFormSchema.ts:45-48`: "Microchip e baiaId são opcionais no DTO real […] decisão confirmada: ficha pode ficar incompleta" — cita a baia, não o porte, e não diz onde a decisão foi registrada. Nenhum registro sobre o porte.
- **Classificação provisória.** Baia: decisão em aberto (há indício de decisão só em comentário de código). Porte: evidência insuficiente.
- **Pergunta.** Porte e baia são obrigatórios no cadastro? Se a baia for, o "animal em trânsito" (sem baia) continua existindo?
- **Impacto.** Obrigatórios: `@NotNull` nos DTOs, migration `SET NOT NULL` (precisa tratar antes os animais sem porte ou sem baia), formulário bloqueando o envio; "em trânsito" deixa de ser representável. Opcionais: atualizar RN07 no DOCX. Em qualquer caso, o PUT continua substituindo a ficha inteira (ver N5).

### D7 — Endereço do responsável obrigatório
- **Evidência.** DOCX RN08: "dados mínimos do responsável (nome, endereço)". DER §3.5 `responsavel_processo.endereco` opcional; V13 nula; `ResponsavelProcessoRequest` sem `@NotBlank` no endereço. Nenhum registro de decisão sobre isso.
- **Classificação provisória.** Evidência insuficiente — pode ser erro de implementação ou o DOCX estar à frente.
- **Pergunta.** O endereço do responsável é obrigatório na abertura do processo?
- **Impacto.** Sim: `@NotBlank`, migration `NOT NULL` (precisa tratar os processos sem endereço), wizard bloqueando a etapa. Não: atualizar RN08 no DOCX.

### D8 — Matriz de acesso (RN09)
- **Evidência.** DOCX RN09 e Quadro 4: Veterinário só Animais e Dashboard/Relatórios; Agente Sanitário só Processos, Ocorrências e Dashboard/Relatórios. V3: Veterinário com leitura e escrita em `PROCESSOS_SANITARIOS` (descrição do cargo cita "processos sanitários"); Agente com leitura em `GESTAO_ANIMAIS`. DER §3.5 ("Exige `PROCESSOS_SANITARIOS:escrita` (Administrador, Veterinário e Agente, V3)"), `frontend/src/lib/nav.ts` e os testes (`RbacMatrixIT#lancarResultadoPorPerfil`, `AnimalControllerIT`) repetem a V3. A V11 já corrigiu um caso da mesma matriz (o Veterinário em ocorrências) com o comentário "[fonte: ______]".
- **Classificação provisória.** Decisão em aberto.
- **Pergunta.** O Veterinário acessa processos sanitários (ler, criar, lançar resultado)? O Agente lê animais?
- **Impacto.** Seguir o DOCX: migration ajustando `cargo_permissao` (sem editar a V3), front e testes; o Veterinário deixa de ver os dados pessoais do responsável e de lançar resultados; quem amostra animais do canil num processo pode precisar ler a ficha (efeito não confirmado no repositório). Seguir a V3: atualizar RN09 e o Quadro 4.

### D9 — Resultado inconclusivo notifica?
- **Evidência.** Decisão registrada: **T34-4** (`docs/decisoes/T34.md` na `fix/T34-follow-up`, `f22e203`) — "Regra 19: só `positivo` notifica (revisão de produto de 2026-10-17)"; DER regra 19 com a mesma revisão. Código em `main`: `ProcessoSanitarioService` (`RESULTADO_QUE_NOTIFICA = "positivo"`). O DOCX ainda diz "Positivo ou Inconclusivo" em cinco trechos: RN10, RF-B03, a descrição da tela T13 e duas especificações de caso de uso. Os comentários "positivo/inconclusivo" de `NotificacaoResultadoService.java:20`, `ResultadoLancadoEvent.java:6` e `application.yml:9` estão desatualizados em `main`, mas **já foram corrigidos na follow-up** (`f22e203`); corrigi-los também nesta branch só geraria conflito.
- **Classificação.** Documentação desatualizada no DOCX — fechada pela T34-4, sem pergunta pendente.
- **Ação.** Atualizar os cinco trechos do DOCX. Os comentários do código ficam corrigidos com o merge da follow-up.
- **Não verificado aqui.** "O envio é registrado e não se repete" (RN10).

### D10 — Estados do processo
- **Evidência.** DOCX RN12: `ABERTO→EM_ANDAMENTO→AGUARDANDO_RESULTADO→CONCLUIDO`. Código e DER §3.5: `ABERTO→AGUARDANDO_RESULTADO→COM_RESULTADO→CONCLUIDO` (`StatusProcesso`, `ck_processo_sanitario_status` da V10). Nenhum registro de que `EM_ANDAMENTO` tenha sido descartado.
- **Classificação provisória.** Decisão em aberto.
- **Pergunta.** Qual é a máquina de estados oficial? `EM_ANDAMENTO` existe?
- **Impacto.** Seguir o DOCX: migration no `CHECK`, enum, transições, front e testes; definir o que acontece com os processos já em `COM_RESULTADO`. Seguir o código: atualizar RN12 no DOCX. Liga-se a D5.

### D11 — Fuso dos timestamps
- **Evidência.** DOCX, capítulo 4: timestamps "armazenados em UTC" e convertidos para America/Sao_Paulo só na apresentação. Código: nenhuma configuração de fuso (`hibernate.jdbc.time_zone`, `-Duser.timezone`); `criado_em`/`ocorreu_em` via `@CreationTimestamp` no fuso da JVM; datas de negócio (`encerrada_em`, `movimentacao.data`) via `Clock` de São Paulo. DER regra 4 fixa o fuso America/São_Paulo, sem dizer como é armazenado.
- **Classificação provisória.** Evidência insuficiente — não há registro da intenção para o armazenamento.
- **Pergunta.** Os timestamps devem ser gravados em UTC ou no horário de São Paulo?
- **Impacto.** UTC: configurar o fuso e converter as datas de negócio; os dados já gravados ficam em fuso misto (precisa de decisão sobre migração). São Paulo: fixar o fuso da JVM em São Paulo e atualizar o DOCX. Hoje o resultado depende do fuso da máquina onde o backend roda.

### D12 — CPF do responsável único
- **Evidência.** DOCX Quadro 89 (dicionário de dados): `cpf` com `UQ`. V13 e DER §3.5, com motivo: "Sem UNIQUE(cpf): o mesmo munícipe pode responder por vários processos, cada um com o próprio registro".
- **Classificação provisória.** Documentação desatualizada no DOCX, a confirmar.
- **Pergunta.** Um mesmo munícipe pode ser responsável em vários processos, cada um com seu registro?
- **Impacto.** Sim: tirar o `UQ` do Quadro 89. Não: o modelo muda (um responsável reutilizado entre processos), o que contraria a V13 e a T29.

### D13 — Fonte da correção da V11
- **Evidência.** `V11__remove_acesso_vet_ocorrencias.sql`: "Correção de regra de acesso [fonte: ______]".
- **Classificação provisória.** Documentação desatualizada (incompleta).
- **Pergunta.** Qual é a fonte da decisão de tirar o Veterinário de ocorrências? (Registrar em `docs/decisoes`; a V11 já aplicada não deve ser editada.)

### D14 — DBML do módulo 4
- **Evidência.** `docs/decisoes/T29.md`: `docs/modulo4-processos.dbml` "está desatualizado em relação ao DER". O `docs/README.md` ainda o lista como fonte de verdade.
- **Classificação provisória.** Documentação desatualizada.
- **Pergunta.** Atualizar o DBML ou retirá-lo da lista de fontes?

## Pendências surgidas nas correções

### N1 — Microchip: maiúsculas e minúsculas
- **Evidência.** A normalização (`AnimalService.normalizarMicrochip`, V16) tira só os espaços; `"abc123"` e `"ABC123"` são microchips diferentes. Nenhuma fonte trata da caixa.
- **Classificação provisória.** Decisão em aberto.
- **Pergunta.** Microchip pode ter letras? Se puder, a caixa importa?
- **Impacto.** Ignorar a caixa: normalizar também a caixa e acrescentar à V16 (ou a uma migration nova) a verificação de duplicatas nessa forma. Considerar a caixa ou só dígitos: nada muda (ou validar formato, se só dígitos).

### N2 — Microchip em criação simultânea
- **Evidência.** A pré-checagem do service responde 409 "Microchip ja cadastrado"; duas criações que passem juntas por ela esbarram no índice `uq_animal_microchip` e recebem 409 com a mensagem genérica "Operacao viola uma regra de integridade dos dados" (inferido do `GlobalExceptionHandler`, sem teste).
- **Classificação provisória.** Decisão em aberto.
- **Pergunta.** Esse caso deve ter a mesma mensagem específica?
- **Impacto.** Sim: mapear `uq_animal_microchip` no handler e testar a concorrência. Não: nada muda.

### N3 — Cargos no token
- **Evidência.** O filtro JWT passou a conferir se o usuário está ativo a cada requisição, mas os cargos continuam vindo do token; uma mudança de cargo só vale no próximo login (validade de 60 minutos).
- **Classificação provisória.** Decisão em aberto.
- **Pergunta.** Mudança de cargo precisa valer na hora?
- **Impacto.** Sim: ler os cargos do banco a cada requisição (mais uma consulta) ou invalidar tokens. Não: registrar o limite de 60 minutos.

### N4 — `VISUALIZACAO` na recarga após mutação
- **Evidência.** Com o A04, edição, status, encerramento e nota de sigilosa devolvem o denunciante mascarado, e o front recarrega o detalhe pelo GET, que registra `VISUALIZACAO` para quem tem a permissão. Cada mutação dessas gera, portanto, um evento de acesso a mais, com o usuário que de fato recebe o dado.
- **Classificação provisória.** Decisão em aberto.
- **Pergunta.** Esse evento é desejado (o dado foi de fato entregue de novo) ou a tela deveria atualizar só os campos sem dado pessoal, sem recarregar o detalhe?
- **Impacto.** Desejado: nada muda. Não desejado: o front passa a atualizar o cache só com os campos não pessoais, sem nova leitura.

### N5 — Baia apagada ao restaurar rascunho quando as opções de baia chegam depois da ficha
- **Evidência (testes executados).**
  - Reprodução (branch local `tmp/reproducao-form-animal`, commit `f0d6dd7`, `frontend/src/features/animais/components/AnimalForm.edicaoPerdaDeDados.test.tsx`; não faz parte desta branch nem está publicada — ver "Disponibilidade da evidência" abaixo): cenário 3 — rascunho de edição sem baia, restaurado com as opções de baia carregadas depois da montagem do formulário → o PUT sai sem `baiaId` e a baia é apagada. Cenário 2b — opções chegando depois da ficha → o select mostra "Sem baia (em trânsito)", mas o PUT mantém a baia.
  - Diagnóstico da auditoria de 2026-10-19 (teste temporário, não versionado, rodado sobre o mesmo commit da reprodução): o **mesmo** rascunho do cenário 3, com as opções de baia já presentes antes de o formulário montar → o select fica em "Baia 3" antes e depois de restaurar e **o PUT mantém a baia**. Rascunho com valores não vazios (porte `pequeno`, Gatil A) → os dois valores são aplicados.
- **Disponibilidade da evidência (pendência para a revisão).** Nenhum teste desta branch nem de `main` reproduz os cenários acima: o teste de restauração existente (`AnimalForm.autosave.test.tsx`, "restaura um rascunho salvo no formato anterior…") usa o formulário de cadastro, sem baia preexistente nem PUT, e não verifica o payload nem a ordem de carregamento das opções. A única evidência versionada é a do commit `f0d6dd7`, que existe só numa branch local, sem cópia remota; o diagnóstico não foi versionado. Para que a revisão possa conferir esta conclusão, a reprodução precisa ser disponibilizada aos revisores (publicada, ou incluída neste PR ou num PR próprio); até lá, a conclusão vale como registro da auditoria, não como algo verificável a partir do repositório.
- **Causa (confirmada por teste; mecanismo interno do React Hook Form não confirmado).** Quando as opções chegam depois da montagem, o `<select>` não controlado (`register('baiaId')`, `AnimalForm.tsx`) fica com valor `""` no DOM, embora o estado do formulário mantenha o id da baia (efeito do cenário 2b). Ao restaurar um rascunho com `baiaId: ''` (convertido para `undefined` por `rascunhoParaValores`), o valor final passa a ser o `""` do DOM e a baia some. Com o DOM coerente (opções presentes na montagem), o mesmo `undefined` mantém a baia, assim como mantém o porte (`<Controller>`). **A perda depende da ordem de carregamento das opções.**
- **Correção de registro.** A versão anterior deste item dava como descartada, para o cenário 3, a hipótese da corrida de carregamento das opções. O diagnóstico acima a refuta. A corrida não é "o `reset()` antes de a `<option>` existir" — no clique em "Restaurar rascunho" as opções já existem —, e sim a dessincronia do select causada pelas opções tardias, que o `reset()` com `undefined` torna definitiva.
- **Efeito colateral do `undefined` (confirmado por teste).** Um campo vazio no rascunho não é restaurado como vazio: `undefined` no `reset()` mantém o valor atual. Um campo que o usuário apagou de propósito volta com o valor da ficha.
- **`undefined` em `defaultValues`.** `AnimalForm.tsx` converte vazios para `undefined` nos `defaultValues` e em `rascunhoParaValores` (24 ocorrências de `|| undefined`). Documentação oficial do React Hook Form (página `useForm`, versão atual; o projeto usa 7.87.0, sem página específica dessa versão): "You should avoid providing `undefined` as a default value, as it conflicts with the default state of a controlled component." A página não indica a alternativa (`''` ou `null`); a página de `reset` recomenda "always provide `defaultValues` when resetting a form to ensure all inputs, especially controlled components, are restored correctly".
- **Máscara de `dirtyFields`.** Não existe no código (nenhum `dirtyFields` ou `keepDirtyValues` em `features/animais`). Proposta, não implementada: persistir a máscara com o rascunho e, na restauração, aplicar só os campos alterados por cima da ficha. Avaliar as duas ordens de chegada — rascunho restaurado depois de a ficha carregar (o caso testado) e ficha chegando depois de o usuário editar (para a qual o `reset` tem `keepDirtyValues`). Nenhum teste cobre essas ordens.
- **Rascunhos antigos, sem máscara.** Não há versão do formato do rascunho (o `VERSAO_BANCO` de `frontend/src/lib/rascunhoDb.ts` versiona as stores do IndexedDB, não o formato). Política a decidir: descartar com aviso ou restaurar tudo como hoje. O versionamento do formato é o que permite detectar a ausência da máscara; ele não resolve um rascunho desatualizado no formato atual.
- **Gravidade.** É o caso mais grave da I1: o mecanismo que protege o formulário contra queda de rede (RNF03, "preservar dados de formulários não submetidos") é o que apaga a baia.
- **Classificação provisória.** Erro de implementação: a dessincronia do select quando as opções chegam depois da ficha (cenário 2b) e a perda que ela causa na restauração. Decisão em aberto: a semântica da restauração (o rascunho sobrescreve campos que mudaram na ficha?) e a política para rascunhos sem máscara.
- **Pergunta.** Restaurar um rascunho deve sobrescrever campos que mudaram na ficha depois de o rascunho ser salvo? Um campo apagado pelo usuário deve voltar vazio? A tela deve mostrar a baia atual mesmo quando ela está inativa?
- **Impacto.** Independentemente da decisão, a tela enganosa e a perda vêm da dessincronia do select; corrigi-la (manter o select coerente com o valor do formulário quando as opções chegam) tira a dependência da ordem de carregamento. A semântica de restauração depende da resposta: merge por campos alterados (máscara de `dirtyFields`) ou restauração integral documentada. "Campo ausente no rascunho mantém o valor atual" não basta, porque o rascunho grava `''` tanto para "o usuário apagou" quanto para "a ficha não tinha o valor quando o rascunho foi salvo".
