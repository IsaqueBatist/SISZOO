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

## Resultado positivo definitivo pelo Agente Sanitário

**Origem:** decisão funcional. **Situação encontrada:** o sistema já permitia. Os cinco resultados lançáveis exigem `PROCESSOS_SANITARIOS:escrita`, que Administrador, Veterinário e Agente têm desde a V3, e não há filtro de resultado por perfil.

"Positivo definitivo" não é um tipo de resultado: é o código `positivo`, que não pode ser corrigido (T35-15, V21). Lançá-lo leva o processo a `COM_RESULTADO`, não encerra o processo nem decide o tratamento. Por isso não houve mudança de domínio, e a decisão ficou fixada em testes por perfil.

## Ocorrências por bairro

**Origem:** decisão funcional. O Veterinário não vê dados agregados de ocorrências por bairro.

| Superfície | Veterinário | Administrador e Agente |
|---|---|---|
| `GET /api/ocorrencias/estatisticas/bairro` | 403 (já era, V11) | Mantido |
| Relatório `ocorrencias_bairro`: prévia, CSV e PDF | 403, sem gerar `doc_id` nem histórico | Mantido |
| `GET /api/relatorios/tipos` | Sem esse tipo | Mantido |
| Relatório `anual_processos`: prévia, CSV e PDF | Sai sem a seção de bairros, com o restante | Mantido |
| Histórico de relatórios | Vê o registro, sem contagens, e não gera de novo | Mantido |

A permissão é a feature `ocorrencias_bairro` (V32). **Fora da restrição:** dados individuais do processo (`bairroOcorrencia` do responsável), que o Veterinário precisa para atender o caso, e os indicadores sem bairro. Arquivos já baixados ficam fora do alcance do sistema.

## Condições de saúde do animal

**Origem:** entrevista de 09/01/2026, linha 13 ("campo de condições especiais (epilepsia, agressividade)"), pedido da Veterinária, e a transcrição do TG, que cita epilepsia, cardiopatia, diabetes e agressividade. As opções e o nome "Condições de saúde pré-existentes" vêm de `docs/prototipo/cadastrar-animal.html`, e a forma foi aprovada nesta etapa. O dicionário de dados do TG guardava isso em `observacoes`, que a ficha nem exibia.

- **Modelo (V33):** catálogo `condicao_saude`, N:N `animal_condicao_saude` e `animal.condicoes_outras`, obrigatório só com "Outras". O campo `observacoes` não muda.
- **Dados antigos:** nada é migrado. Animal sem condição marcada não significa que não tenha nenhuma.
- **Tela:** checkboxes na etapa de saúde, resumo na revisão e selos na ficha, que passa a mostrar também as observações.
