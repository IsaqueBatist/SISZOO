# Relatório da Fase 4 — versão final do TG (23/10/2026)

Entrada: `docs/tg/SISZOO_v2_alinhado.docx` (Fase 3, com controle de alterações). Saída: **`docs/tg/SISZOO_v3_final.docx`**
(sem alterações controladas, campos atualizados) e `docs/tg/SISZOO_v3_final.pdf` (exportado pelo Word para conferência).
`SISZOO_versao_limpa.docx` e `SISZOO_v2_alinhado.docx` permanecem intactos. Intermediários em `docs/tg/build/`.

## Correções pedidas e o que foi feito

| # | Pedido | Feito |
|---|---|---|
| 1 | Capturas dos relatórios sem distorcer os cartões | T14 e T18–T23 recapturadas em **1920×1080** (viewport, rolada até o painel). Causa dos cartões empilhados era um defeito do produto: a regra `.kpi-grid` vivia em `Dashboard.css` e não carregava ao abrir `/relatorios` diretamente — corrigido (regra global em `styles/components.css`, PR `fix/kpi-grid-global`). As 7 capturas usam o seed oficial do projeto (`npm run db:seed`, dados fictícios), que estava carregado no banco de desenvolvimento; as outras 16 continuam com o `seed_demo.py`. |
| 2 | Descrições das telas mais detalhadas, sem exagero | 17 parágrafos da Seção 5.2 reescritos (6–9 frases: elementos da tela, ações, regras/RFs, perfis, rotina substituída, comportamento em erro/queda de rede). Apêndice E ganhou um parágrafo descritivo (3–5 frases) antes de cada uma das 6 figuras. |
| 3 | Numeração a partir da Introdução, contando desde a capa | Seção pré-textual própria (capa → sumário) sem cabeçalho/rodapé e com contagem iniciada em 1; seção do corpo com cabeçalho (número no canto superior direito, 10 pt, a 2 cm da borda — NBR 14724). Os 43 rodapés antigos foram removidos. Introdução = página 17 (16 páginas pré-textuais). |
| 4 | Aceitar todas as alterações | 526 revisões aceitas no Word (automação, cópia); 0 `w:ins`/`w:del` no arquivo final. Todas as edições desta fase são diretas. |
| 5 | Retirar fotos repetidas da visita | Removidas do Apêndice D as Figuras 49, 50 e 51 da v2 (fotos de monitor com planilhas Excel, já reproduzidas como trechos de planilha no Anexo A), com descrições e fontes; intro do apêndice reescrita. Figuras renumeradas automaticamente: Ap. D 48–56, Ap. E 57–62, Anexo A 63–66 (total 66). |
| 6 | Formatação ABNT | Ver seção abaixo. |

## Formatação ABNT aplicada (NBR 14724, 6024, 6027, 6023, 10520)

- **Estrutura pré-textual**: capa, folha de rosto (quebra de página garantida), dedicatória e epígrafe sem título, agradecimentos,
  resumo e abstract em parágrafo único com espaçamento simples, **Lista de Figuras e Lista de Quadros como campos automáticos**
  (`TOC \c "Figura"` / `TOC \c "Quadro"`, com pontilhado e página), lista de abreviaturas completada (E2E, FK, NN, PK, RN, RNF, UQ;
  UTC retirada) e **Sumário** como campo por níveis de título (`TOC \o "1-3"`), na ordem listas → abreviaturas → sumário.
- **Legendas**: todas as 66 figuras e 94 quadros com estilo *Caption* e campo `SEQ` (10 pt, simples, acima da ilustração, mantidas
  junto da ilustração), "Fonte:" em 10 pt simples (centralizada após figura, à esquerda após quadro, ponto final padronizado).
- **Títulos**: seções primárias em 12 pt, negrito, caixa alta, iniciando em página nova (Heading1 com quebra automática; quebras
  manuais redundantes removidas); seções secundárias em negrito; terciárias em negrito itálico (distinção tipográfica da NBR 6024).
  Introdução e Considerações Finais permanecem sem numeração, decisão do autor.
- **Corpo**: Times New Roman 12, espaçamento 1,5, justificado, recuo de parágrafo 1,25 cm (estilo `CorpoTexto`, 124 parágrafos),
  margens 3/2/3/2 cm; tabelas e legendas em 10 pt simples; imagens centralizadas (inclusive Ap. D/Anexo A).
- **Referências**: alinhadas à esquerda, espaçamento simples, separadas por um espaço (parágrafos vazios removidos).
- **Citações × referências**: (RECHARTS, 2026) no Quadro 14 e (RIBEIRO, 2022) no Quadro 2 e na Seção 1.9 (frase inicial
  restaurada a partir do título da referência); fontes do Anexo A como "documento não publicado"; legenda da Figura 53 (antiga 56)
  sem espaço duplo; travessão em todas as legendas.
- Não alterado: fonte Times New Roman (já conforme), citações longas (nenhuma com recuo foi encontrada no texto).

## Verificações

- `v3_campos.docx`: XML bem formado em todas as partes; 66 `SEQ Figura`, 94 `SEQ Quadro`, 3 campos TOC, 0 rodapés, 1 cabeçalho,
  45 seções, 66 imagens sem relacionamento órfão.
- Word: 617 campos atualizados, 198 páginas, 66 ilustrações; PDF inspecionado nas páginas 1–3, 15 (Sumário), 17 (Introdução com
  número), 42, 85 (Quadro 15), 87 (Figura 31), 108 (Referências), 150 (dicionário), 171 (Ap. D), 192 (Ap. E), 196 (Anexo A).
- Código: apenas a correção de CSS da grade de KPIs; `git status` limpo além de `docs/tg/` (não versionado).

## Pendências para os autores

| # | Item |
|---|---|
| P4-01 | Folha de aprovação (banca, data, assinaturas) não inserida, por decisão do autor; obrigatória pela NBR 14724. |
| P4-02 | "[APRENDIZADOS E DIFICULDADES, NAS PALAVRAS DOS AUTORES.]" nas Considerações Finais continua a redigir. |
| P4-03 | Figuras 7–25 (diagramas) seguem as originais; PNG fiéis ao código em `analise_fase3/diagramas/` (ver `diagramas_para_revisar.md`). |
| P4-04 | Quadros e figuras não citados no texto antes de aparecerem (achados F1-053/F1-054) — não tratados nesta fase. |
| P4-05 | As capturas dos relatórios (T14, T18–T23) usam o seed oficial; as demais, o seed de demonstração — números diferentes entre telas. Se quiserem uniformizar, basta rodar `capturas.mjs` para todas as telas com o mesmo banco. |
| P4-06 | No seed oficial, duas ocorrências têm encerramento anterior à abertura, e o relatório de Ocorrências por Bairro mostra tempo médio negativo; a captura usou o período 19–23/10/2026 para evitá-lo. Vale corrigir o seed (ou proteger o cálculo). |
| P4-07 | O Apêndice D deixa espaço em branco após o parágrafo descritivo quando a foto não cabe na mesma página (legenda e foto ficam juntas). Opcional reduzir as fotos. |
| P4-08 | Conferir no Word, depois de abrir o `.docx`, se o Sumário e as listas pedem nova atualização (os campos já estão atualizados e o arquivo não traz `updateFields`). |
