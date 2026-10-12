package com.siszoo.ocorrencias.entity;

// DER §3.4. Cada tipo corresponde a uma transicao da matriz D5 ou a "sem
// mudanca de status" — amarrado tambem no banco (ck_movimentacao_ocorrencia_transicao, V10).
public enum TipoMovimentacaoOcorrencia {
    REGISTRADA,
    EQUIPE_DESPACHADA,
    PROCESSO_VINCULADO,
    AGUARDANDO_RESULTADO,
    ENCERRADA,
    NOTA_INTERNA
}
