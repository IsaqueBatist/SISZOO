# Decisões funcionais de 31/10/2026

Decisões aprovadas pela responsável pelo projeto, que fecham as pendências de `ux-auditoria.md`. Quando a origem não é a entrevista de 09/01/2026 nem o TG, isso está dito: estes registros não reescrevem aqueles documentos.

Sessão e autenticação têm documento próprio: [sessao.md](sessao.md).

## Gestão de usuários

**Origem:** decisão funcional. **Decisões complementares:** um Administrador pode alterar outro; ninguém muda o próprio cargo nem redefine a própria senha por essa rota; o último Administrador ativo fica protegido.

A redefinição usa senha temporária, entregue em mãos pelo Administrador, e reaproveita o primeiro acesso. Não há fluxo por e-mail porque a única mensagem que o sistema envia hoje é a notificação de resultado. A senha temporária passou a valer no backend: antes, o bloqueio estava só na tela.

## Castração e contato humano

**Origem:** decisão funcional. Supera a FS-6 (`ficha-completa-seed-fuso.md`), a RN-AN01 e o `NOT NULL` da V13 e da V4 nesses campos.

As duas informações têm três estados: sim, não e não informado (`null`).

| Efeito | Regra |
|---|---|
| Formulário | Começa em "Não informado" e não exige resposta |
| Processo urgente | Só com `contato_humano` verdadeiro; "não informado" não marca urgência |
| Nível de contato e agressão | Só existem com contato verdadeiro |
| Alerta `nao_castrado` | Conta só o "não" explícito |
| Relatório anual | Mostra a quantidade de processos com contato não informado na prévia, no PDF e no CSV |

**Limitação:** os registros anteriores à V31 continuam com `false`, porque não dá para distinguir uma resposta real do valor padrão que a tela e a coluna preenchiam sozinhas.
