package com.siszoo.relatorios.dto;

// "baiasSuperlotadas" e "baiasNoLimite" substituem, com dados reais e
// computaveis hoje, os KPIs "Taxa de superlotação" (em dias) e
// "Transferências internas" do protótipo — nenhum dos dois é computável com
// o schema atual (sem histórico diário de ocupação nem auditoria de troca de
// baia do animal). Decisão tomada na implementação da T41, documentada no PR.
public record KpisOcupacaoBaiasResponse(
        int ocupacaoMediaPercentual,
        long baiasSuperlotadas,
        long baiasNoLimite,
        int capacidadeTotal) {
}
