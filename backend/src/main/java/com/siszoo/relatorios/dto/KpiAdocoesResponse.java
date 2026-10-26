package com.siszoo.relatorios.dto;

// Snapshot do status ATUAL dos animais (mesma fonte do relatorio de adocoes,
// RelatorioAdocoesService): nao ha data de adocao no schema, entao nao existe
// "adocoes no mes" nem meta mensal ate a tabela `adocao` do DER ser criada.
public record KpiAdocoesResponse(long adotados, long disponiveis) {
}
