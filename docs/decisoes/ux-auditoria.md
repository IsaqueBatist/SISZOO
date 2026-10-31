# Decisões — correções da auditoria de UX

Uma linha por decisão, no formato de `T29.md`. Origem: correção dos achados da auditoria de UX/UI (30/10/2026).

## Decisões

- **UX-1 Filtros de lista ficam no `sessionStorage`, não na URL.** A busca de Ocorrências aceita nome de denunciante, que iria para o histórico do navegador de uma máquina compartilhada. Morrem com a aba ou ao encerrar a sessão (`lib/useFiltrosLista.ts`).
- **UX-2 Rascunho à espera de escolha não é sobrescrito.** Com o aviso de Restaurar/Descartar na tela, o autosave fica suspenso. O que for digitado antes da escolha só é salvo depois dela.
- **UX-3 Clicar fora não fecha modal.** Um clique perdido não pode encerrar um registro: fecha por Esc, X ou Cancelar (`components/Modal.tsx`).
- **UX-4 Data de fato técnico não vem preenchida.** Aplicação, início, procedimento, coleta e resultado usam o atalho "Hoje". A data de registro continua sendo gravada pelo servidor. Abertura de ocorrência e de processo, entrada do animal e solicitação de exame seguem com hoje: são o próprio registro.
- **UX-5 Tipo de ocorrência sem valor padrão.** É classificação técnica; quem registra escolhe.
- **UX-6 Vigilância Epidemiológica.** Enquanto o envio for mock (DH-25), a tela diz que o aviso é manual. A pendência rastreável por processo depende de decisão do CCZ.
- **UX-7 Correção de resultado exige motivo na tela.** O backend não exige `observacoes`; o motivo obrigatório vale para a interface, para o histórico explicar a correção. O positivo segue definitivo (T35-15).
- **UX-8 Dados do denunciante no processo só a pedido.** O botão não aparece em ocorrência sigilosa ou anônima, e nada é copiado sozinho.
- **UX-9 Busca de processos (`GET /api/processos?q=`).** Por protocolo, nome do responsável, Nº GAL e Nº SINAN, sem mudança de permissão nem migration.

## Pendências

- Renovação de sessão, sessão entre abas, correção de dados do processo, edição e redefinição de senha de usuário, campo de condições especiais do animal e respostas explícitas para castração e contato humano dependem de decisão funcional.
- Mensagens do backend sem acento: as duas que chegavam ao usuário nos fluxos auditados foram tratadas na tela; as demais continuam como estão.
