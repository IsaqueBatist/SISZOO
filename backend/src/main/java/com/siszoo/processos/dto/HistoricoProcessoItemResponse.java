package com.siszoo.processos.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.siszoo.usuarios.entity.AcaoAuditoria;

// Mini trilha de auditoria do processo (T37): deliberadamente magro — sem
// payloadAntes/payloadDepois (poderiam conter dado de amostra sensivel) e
// sem nada do responsavel/denunciante. So "quando/quem/o que".
public record HistoricoProcessoItemResponse(
        UUID id,
        String usuarioEmail,
        AcaoAuditoria acao,
        LocalDateTime ocorreuEm) {
}
