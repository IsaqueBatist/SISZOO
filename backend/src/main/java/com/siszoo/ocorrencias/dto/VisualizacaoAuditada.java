package com.siszoo.ocorrencias.dto;

import java.util.UUID;

// Evento VISUALIZACAO ja gravado para uma resposta (T26). Fica com o
// controller ate o corpo ser escrito: se a escrita falhar, e o que o evento
// compensatorio ENTREGA_INTERROMPIDA referencia. Sem dado pessoal.
public record VisualizacaoAuditada(UUID eventoId, String entidade, UUID entidadeId, UUID ocorrenciaId) {
}
