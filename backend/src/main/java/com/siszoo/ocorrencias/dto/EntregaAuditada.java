package com.siszoo.ocorrencias.dto;

// Conteudo de uma leitura que pode entregar dado de denunciante sigiloso (T26),
// com o VISUALIZACAO gravado para ela — null quando a leitura nao e auditada
// (nao sigilosa, sem denunciante, sem a permissao).
public record EntregaAuditada<T>(T conteudo, VisualizacaoAuditada visualizacao) {
}
