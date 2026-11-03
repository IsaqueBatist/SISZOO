# Decisões — restrição do módulo de animais ao Agente Sanitário (02/11/2026)

Uma linha por decisão, no formato de `T29.md`. Ponto de partida: o Agente Sanitário via "Animais" no menu lateral e
navegava o acervo do canil sem restrição (lista, ficha com histórico clínico, alertas de reforço vacinal), o que não
corresponde à função dele — ocorrências/denúncias e processos sanitários. Pedido: retirar o acesso à lista de animais
**sem** retirar a leitura na API, porque o formulário de processo sanitário busca animais do canil.
Regra consolidada: `docs/DER.md` §5, regra 33.

## Decisões

- **RA-1 (escopo: interface, não API)** A autoridade `GESTAO_ANIMAIS:leitura` do Agente Sanitário permanece em
  `cargo_permissao` (V3, linha do cargo `...0003`). Nenhuma migration, nenhuma mudança de backend. Motivo: o
  formulário de processo sanitário, que o Agente cria, busca animais existentes por `GET /api/animais`
  (`BuscaAnimalCanil.tsx`, amostra com `origem = canil`), e o mesmo módulo cobre os catálogos de espécie/raça
  (`GET /animais/catalogos`) usados nesse formulário. Retirar a leitura quebraria o fluxo com 403 silencioso.
- **RA-2 (limitação declarada)** A restrição é de **usabilidade/menor surpresa, não um controle de segurança**. O JWT
  do Agente continua autorizando `GET /api/animais` e `GET /api/animais/{id}`, alcançáveis por DevTools ou curl.
  Decisão deliberada de não descrever esta restrição como barreira de sigilo/LGPD no DER nem no TG. Caminho para um
  limite real, se um dia for exigido: feature própria em `cargo_permissao` (ex.: `GESTAO_ANIMAIS:acervo:leitura`) +
  endpoint enxuto `GET /api/animais/resumo?q=` devolvendo só `id/nome/especie/microchip` para o autocomplete. Ambos
  modelo-alvo, fora deste escopo.
- **RA-3 (fonte única da regra)** A regra é a remoção de `'animais'` do `access` do perfil `agente` em `lib/nav.ts`.
  Motivo: o front não lê autoridades da API — o `/me` (`UsuarioResponse`) devolve só `cargos: string[]`, que
  `roleKeyFromCargos` normaliza para um `RoleKey` comparado contra `ROLES[...].access`. Tudo que deriva de `access`
  acompanha de graça: o menu lateral (`getNavForRole`) e a tela "Permissões deste perfil" (`Perfil.tsx`, que cruza
  `NAV_ALL` × `role.access` e passa a mostrar Animais com ✗).
- **RA-4 (guard de rota, não só menu)** Esconder do menu seria cosmético: `/animais` e `/animais/:id` não tinham
  guard algum (só `RotaProtegida`, de sessão) e seguiriam acessíveis por URL direta. Criado
  `routes/RotaLeituraAnimais.tsx` envolvendo `/animais`, `/animais/:id` e `/alertas/vacinas`, com
  `RedirecionarSemAcesso para="/dashboard"` (que já emite o toast "Seu perfil não tem acesso a essa área.").
- **RA-5 (o guard usa `podeAcessar`, não `roleKey ===`)** Divergência deliberada do padrão dos guards irmãos
  (`RotaAdmin`, `RotaGestaoBaias`, `RotaEscritaAnimais`…), que comparam `roleKey` literalmente. `RotaLeituraAnimais`
  chama `podeAcessar(roleKey, 'animais')` para derivar de `ROLES` e não duplicar a matriz em dois lugares — a
  comparação literal já causaria divergência com `nav.ts` na primeira mudança de perfil.
- **RA-6 (ficha individual também bloqueada)** Decisão da equipe: o Agente perde a lista **e** a ficha
  (`/animais/:id`). Motivo: a ficha é dado clínico (abas de vacinação, procedimentos, prescrições, exames, anexos),
  domínio do Veterinário, e o processo sanitário não depende dela — a amostra guarda o próprio retrato do animal
  (espécie, sexo, raça, coloração, pelagem, idade, peso, status clínico) e o autocomplete já mostra nome, microchip,
  espécie e sexo, o bastante para identificar o animal certo.
- **RA-7 (link em `ProcessoDetalhe`)** O botão "Ver ficha do animal" do card de amostra passa a aparecer só com
  acesso ao módulo; sem acesso, exibe o badge neutro "Animal do canil", irmão do "Animal de campo" que já existia
  para amostra sem `animalId`. Motivo: deixar o link levaria o Agente a clicar e ser expulso para o dashboard com um
  toast — pior que não ter o link.
- **RA-8 (alerta de reforço vacinal)** Decisão da equipe: o alerta vacinal é tratado como parte da gestão de animais
  e também sai para o Agente, em três pontos — a rota `/alertas/vacinas` (RA-4), o card `AlertaCriticoVacinas` do
  dashboard e as notificações do sino. O filtro do sino fica em `useResumoNotificacoes` (na origem dos dados), não em
  `MenuNotificacoes` (na view), para não deixar a view decidir o que o hook já sabe. Sem vazamento pela lista
  genérica de alertas: `vacina_vencendo`/`vacina_vencida` já estavam em `TIPOS_JA_EXIBIDOS_EM_CARD_DEDICADO`, então
  o `AlertaCriticoGenerico` nunca os renderiza.
- **RA-9 (fora do escopo: Medicamentos e Vacinas)** Os catálogos `/medicamentos` e `/vacinas` pertencem ao módulo
  `GESTAO_ANIMAIS` no backend, mas continuam no menu do Agente. Motivo: são catálogos de apoio, não o acervo de
  animais nem dado clínico de indivíduo; o pedido era a lista de animais. Divergência consciente entre "módulo do
  backend" e "módulos do menu", que já existia (o Agente nunca teve `baias`).
- **RA-10 (destino do `RotaEscritaAnimais`)** Trocado de `/animais` para `/dashboard`. Motivo: `/animais` passou a
  ser bloqueado, então o Agente que caísse em `/animais/novo` seria redirecionado duas vezes e receberia dois toasts.
- **RA-11 (testes de modo leitura da ficha)** `FichaAnimal.test.tsx` e `AbaExames.test.tsx` usavam
  `['Agente Sanitário']` como "perfil só-leitura" para afirmar a ausência dos botões de registro. Com RA-6 nenhum
  perfil alcança a ficha sem escrita (Admin RWD, Veterinário RW, Agente bloqueado), e trocar para `vet` inverteria a
  asserção. Os casos foram mantidos, com o título e um comentário reescritos: passam a cobrir o modo leitura do
  componente como defesa em profundidade, não um fluxo navegável.
- **RA-12 (regressão do fluxo preservado)** Acrescentado a `ProcessoForm.test.tsx` um caso em que o Agente busca e
  seleciona um animal do canil e o `animalId` chega no POST. É o teste que impede a restrição de ir longe demais: se
  ele quebrar, RA-1 foi violada.
