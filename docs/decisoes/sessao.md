# Sessão com renovação deslizante

Origem: decisão funcional de 31/10/2026 (pendência de `ux-auditoria.md`). Permitir renovação, abrir nova aba sem novo login, sessão válida enquanto houver uso e expiração depois de 60 minutos de inatividade. Não é um requisito da entrevista nem do TG, que descrevem login stateless.

## Decisões

| # | Decisão | Motivo |
|---|---|---|
| S-1 | Volta a existir sessão no servidor (`sessao_usuario`, V29), revertendo a parte "stateless" do DER e a remoção da V8 | Inatividade, logout e invalidação exigem estado. A tabela antiga nunca foi usada e tinha outro contrato |
| S-2 | Token de acesso JWT de 15 min, só em memória, com claim `sid` | Token roubado da memória dura pouco e cai junto com a sessão |
| S-3 | Token de renovação opaco em cookie `HttpOnly`, `SameSite=Strict`, `Path=/api/auth`, sem `Max-Age`. No banco, só o hash SHA-256 | JavaScript não lê o cookie, e vazar o banco não entrega sessões. O cookie morre com o navegador |
| S-4 | `POST /api/auth/renovar` recebe `houveAtividade`. Só `true` desliza `ultima_atividade_em` | A renovação do token de acesso não pode manter uma sessão abandonada |
| S-5 | Atividade é interação real (ponteiro, teclado, roda, toque), medida no navegador e compartilhada entre abas pelo `localStorage`. Requisição não conta | O polling de uma aba esquecida não é uso |
| S-6 | Com atividade, o servidor é avisado no máximo a cada 60 s | A expiração acontece entre 59 e 60 min depois do último uso |
| S-7 | Rotação do token no máximo a cada 5 min, com tolerância de 60 s para o anterior. Reuso fora disso revoga a sessão e audita `SESSAO_REVOGADA` | Detecta token roubado sem derrubar renovações simultâneas |
| S-8 | `navigator.locks` serializa a renovação entre abas e a promessa em voo a serializa na aba. Sem Web Locks, a tolerância de S-7 cobre o caso | Evita renovações simultâneas |
| S-9 | Cada aba obtém o próprio token de acesso pelo cookie. `BroadcastChannel` leva só avisos (`login`, `logout`, `expirada`, `inatividade`), nunca token | O token não trafega entre abas |
| S-10 | `JwtAuthenticationFilter` confere sessão ativa, usuário ativo e prazo a cada requisição | Logout, revogação e desativação valem na hora |
| S-11 | `renovar` e `logout` exigem o header `X-SISZOO-Sessao`, que força o preflight de CORS. Outras origens são recusadas pelo filtro de CORS | Autenticam por cookie, então precisam dessa proteção. Os demais endpoints seguem só com Bearer, e o CSRF continua desligado com justificativa |
| S-12 | Trocar a senha encerra as outras sessões do usuário. Desativar, redefinir senha ou mudar cargo encerra todas | Credencial ou permissão mudou |
| S-13 | Cargos relidos a cada emissão do token | Fecha a N3: mudança de cargo vale em no máximo 15 min, e a troca feita pelo Administrador revoga a sessão na hora |
| S-14 | Expirar segue o caminho do 401: preserva rascunhos e a tela de retorno. Logout explícito apaga rascunhos em todas as abas | Mesmo critério da T42 |

## Comportamento

- **Nova aba ou recarga:** a tela mostra "Carregando sua sessão…", chama `renovar` e entra sem pedir login. Sem sessão válida, vai para o login guardando o destino.
- **Aviso:** 5 minutos antes do limite, um aviso explica que basta continuar usando. Não há botão extra, porque qualquer interação já conta como atividade.
- **Queda de rede na renovação:** não encerra a sessão. Só a recusa do servidor (401 ou 403) encerra.

## Configuração

| Propriedade | Padrão | Observação |
|---|---|---|
| `siszoo.sessao.inatividade-minutos` | 60 | Decisão funcional; o front tem o mesmo valor em `lib/sessao/atividade.ts` |
| `siszoo.jwt.expiracao-minutos` | 15 | |
| `siszoo.sessao.rotacao-minutos` | 5 | |
| `siszoo.sessao.tolerancia-token-anterior-segundos` | 60 | |
| `SISZOO_COOKIE_SECURE` | `false` | Use `true` em produção com HTTPS |
| `SISZOO_COOKIE_SAMESITE` | `Strict` | Front e API precisam ser do mesmo site. Em domínios diferentes, use `None` com `Secure` |

## Riscos aceitos

- **Sem limite absoluto de sessão.** A decisão pede validade enquanto houver uso.
- **Atividade declarada pelo cliente.** O servidor garante o teto de 60 min sem renovação, mas não distingue um cliente adulterado que se declare ativo.
- **Computador compartilhado.** Fechar as abas não encerra a sessão: ela termina ao fechar o navegador, ao sair ou por inatividade.
- **Perda de resposta durante a rotação.** Se a resposta se perder e a tolerância passar, o próximo uso do token antigo revoga a sessão. A pessoa entra de novo, e os rascunhos ficam.
- **Sessões vencidas ficam na tabela.** Não há expurgo de `sessao_usuario`. A pendência de retenção da T43 passa a incluí-la.
