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

## Edição de processo sanitário

**Origem:** decisão funcional. Só o Administrador edita processo já registrado, e toda edição é auditável.

- **Permissão:** feature própria `edicao_registro` (V30). A escrita do módulo, que Veterinário e Agente têm, não basta.
- **Justificativa:** obrigatória, de 10 a 1000 caracteres (decisão desta etapa). Não há regra anterior que a exija, e o "motivo obrigatório da correção" de resultado continua pendente com o CCZ (T34-3).
- **Auditoria:** reaproveita `auditoria_evento`, sem tabela nem coluna nova. O evento `ATUALIZACAO` leva autor, data, IP, antes, depois e justificativa no payload.
- **Dado pessoal:** exceção à D23, aprovada nesta etapa. O evento da edição guarda os valores anteriores e novos do responsável, porque corrigir um CPF não pode apagar o original. A consulta é só do Administrador. Esse dado fica permanente na trilha imutável, o que reforça a pendência de retenção da T43.
- **Limites da edição:** protocolo, data de abertura (T34-5), status, resultados, desfecho, vínculo e notificação ficam de fora, assim como incluir, remover ou trocar amostras. A doença só muda antes do resultado, porque o resultado foi dado para aquela doença. Este último limite é uma decisão de implementação, a confirmar com o CCZ.
