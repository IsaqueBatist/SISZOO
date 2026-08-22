# Documentação — SISZOO

Documentação de análise e modelagem do sistema, derivada do protótipo navegável
e da entrevista com a equipe do CCZ-Itu (09/01/2026).

## Conteúdo

| Arquivo                   | O que é                                                                                                                                                              |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DER.md`                  | Diagrama Entidade-Relacionamento completo: todas as entidades, atributos, relacionamentos, catálogos e regras de negócio. É a referência central do modelo de dados. |
| `diagramas/`              | Diagramas lógicos por módulo, em formato DBML.                                                                                                                       |
| `entrevista_09jan2026.md` | Registro da entrevista de levantamento de requisitos com a equipe do CCZ.                                                                                            |
| `planilha_animais.md`     | Estrutura da planilha Excel atual de animais (sistema legado a ser substituído).                                                                                     |
| `planilha_processos.md`   | Estrutura da planilha Excel atual de processos sanitários (legado).                                                                                                  |

## Diagramas lógicos (DBML)

Os arquivos em `diagramas/` usam a sintaxe **DBML** (Database Markup Language).
Para visualizar graficamente, cole o conteúdo em https://dbdiagram.io — ele
renderiza o diagrama entidade-relacionamento automaticamente.

| Módulo                   | Arquivo                                  | Tabelas principais                                            |
| ------------------------ | ---------------------------------------- | ------------------------------------------------------------- |
| 1 — Usuários & Acesso    | `diagramas/modulo1-usuarios-acesso.dbml` | Usuario, Sessao, Cargo, CargoPermissao, AuditoriaEvento       |
| 2 — Animais              | `diagramas/modulo2-animais.dbml`         | Animal, Baia, Vacinacao, Procedimento, Medicacao              |
| 3 — Ocorrências          | `diagramas/modulo3-ocorrencias.dbml`     | Ocorrencia, Denunciante, Denunciado, Movimentacao             |
| 4 — Processos Sanitários | `diagramas/modulo4-processos.dbml`       | ProcessoSanitario, ResponsavelProcesso, ResultadoLaboratorial |
| 5 — Relatórios           | `diagramas/modulo5-relatorios.dbml`      | RelatorioGerado                                               |

## Como usar

Estes documentos são a fonte de verdade do modelo de dados. Ao implementar
qualquer entidade ou endpoint, compare com o `DER.md` — não invente campos que
não estejam previstos aqui. Se algo estiver faltando na modelagem, atualize a
documentação primeiro e depois o código.
