# Decisões - responsividade do frontend

Uma linha por decisão, no formato de `T29.md`. Origem: revisão de responsividade de 02/11/2026. As regras ficam em
`frontend/src/styles/components.css` (bloco final de `@media`), `lib/tabelasResponsivas.ts` e `components/layout/Layout.tsx`.

## Decisões

- **RS-1 Escala única de breakpoints.** 360 (celular pequeno), 480 (celular), 768 (tablet e gaveta de menu), 1024 (notebook) e 1280 (desktop). Os valores soltos que existiam (700, 760, 800, 900, 1000, 1100 e 1440) foram trocados pelo mais próximo da escala. O JavaScript usa os mesmos pontos: `useTelaEstreita` em 768 e o recolhimento automático da sidebar em 1024.
- **RS-2 Navegação.** Acima de 1024 px a sidebar fica aberta; entre 769 e 1024 px começa recolhida em trilho de ícones (o usuário pode expandir); até 768 px vira gaveta. A gaveta abre pelo botão "Abrir menu" (`aria-expanded`, `aria-controls`), leva o foco para "Fechar menu", deixa o conteúdo atrás `inert`, trava a rolagem da página e fecha com Esc, toque no fundo, botão de fechar ou ao navegar, devolvendo o foco ao botão que a abriu.
- **RS-3 Tabelas em cartões.** Até 768 px, tabelas `table.data` com 4 colunas ou mais viram cartões: o primeiro campo (nome ou protocolo) é o título, os demais aparecem em duas colunas com o rótulo do cabeçalho, e a ação de botão único fica no canto do cartão (ações múltiplas, como em Usuários, ficam numa faixa no rodapé). Entre 600 e 768 px, dois cartões por linha. `lib/tabelasResponsivas.ts` copia o texto de cada `th` para `data-rotulo` das células e restaura os papéis de tabela (`role="table"`, `row`, `cell`), porque mudar o `display` apagaria a semântica para leitores de tela; um `MutationObserver` no `Layout` mantém isso em telas, abas e modais. Tabelas de até 3 colunas (agregações dos relatórios) continuam como tabela.
- **RS-4 Tabela com coluna fixa.** Entre 769 e 1279 px a tabela mantém o formato, com rolagem horizontal no próprio contêiner e a primeira coluna fixa (`position: sticky`), para o registro nunca perder a identificação.
- **RS-5 Linha clicável no toque.** O cartão inteiro responde ao toque e abre o detalhe (`useLinhaClicavel`), com destaque de fundo e borda ao tocar; botões e menus internos continuam independentes.
- **RS-6 Áreas de toque.** Em telas de até 768 px ou com ponteiro de toque (`pointer: coarse`, como tablets em paisagem), `--control-height` e `--control-height-sm` passam a 44 px, e itens de menu, abas, links de voltar, resumos recolhíveis, caixas de seleção e botões de ícone ganham 44 × 44 px. Com mouse, o desktop mantém controles de 36 px.
- **RS-7 Teclado virtual e zoom.** Campos usam 16 px no celular (abaixo disso o iOS amplia a página ao focar). A meta viewport tem `interactive-widget=resizes-content`, para a altura útil encolher com o teclado, e `html` tem `scroll-padding-top` com a altura da topbar, para o campo focado não ficar atrás dela.
- **RS-8 Modais como painel inferior.** Até 768 px o modal ocupa a largura toda, sobe do rodapé, limita a altura a `100dvh` menos uma margem, rola o corpo internamente e mantém cabeçalho com "Fechar" (44 px) e rodapé com as ações (respeitando `safe-area-inset-bottom`).
- **RS-9 Dashboard no celular.** "Requer atenção" vem primeiro e completo; "Acompanhamento" começa recolhido em telas estreitas, com o botão "Mostrar N itens". Indicadores em 2 colunas (1 abaixo de 360 px) e gráficos em coluna única até 1024 px.
- **RS-10 Filtros e cabeçalhos.** No celular a busca ocupa a linha inteira, os filtros ficam dois por linha (o de pendência, mais longo, ocupa a linha), o período vira "rótulo / início até fim" e a ação principal da página ocupa a largura.
- **RS-11 Ficha do animal.** Em uma coluna (até 1024 px) a foto deixa de ser quadrada e fica com altura entre 180 e 280 px.
- **RS-12 Desktop amplo.** O conteúdo vai até 1760 px de largura, para não deixar uma faixa vazia em telas de 1920 px.

## Validação

Roteiro com Playwright em pasta temporária (AT-14): 22 telas em 320, 375, 430, 683 (1366 com zoom de 200%), 768, 1024, 1366 e 1920 px, medindo estouro horizontal, elementos fora da tela, textos cortados e alvos de toque. Tablet a 1024 px validado com emulação de toque (`pointer: coarse`). Fluxos de toque a 375 px nos dois temas: gaveta, cartões, menu de ações, modal e campo com teclado aberto.

## Pendências

- No celular, a ficha do animal mostra todo o cartão de identificação antes das abas (histórico, vacinas, procedimentos); a ordem foi mantida.
