package com.siszoo.processos.event;

import java.util.UUID;

// Publicado por ProcessoSanitarioService.registrarResultado dentro da
// transacao de escrita, so para positivo (regra 19, T34-4). So leva o
// id: nenhum dado pessoal no evento, e o listener le o processo/responsavel
// de novo, ja depois do commit (AFTER_COMMIT), numa transacao propria.
public record ResultadoLancadoEvent(UUID processoId) {
}
