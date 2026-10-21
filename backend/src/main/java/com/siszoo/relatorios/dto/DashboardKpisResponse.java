package com.siszoo.relatorios.dto;

import java.util.List;

// Sem bloco "adocoes": o DER documenta a tabela `adocao` (§3.x, data_adocao),
// mas ela nunca foi implementada (sem migration, sem entidade, sem rastro em
// auditoria) — não há hoje nenhuma fonte de dados confiável para "adoções no
// mês". Decisão registrada em docs/contratos/dashboard-kpis.md: o bloco
// fica fora da resposta até uma tarefa futura criar essa tabela.
public record DashboardKpisResponse(
        KpiAnimaisResponse animais,
        KpiVacinacaoResponse vacinacao,
        KpiOcorrenciasResponse ocorrencias,
        List<AlertaCriticoResponse> alertas) {
}
