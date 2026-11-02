package com.siszoo.usuarios.entity;

public enum AcaoAuditoria {
    CRIACAO,
    ATUALIZACAO,
    DESATIVACAO,
    REATIVACAO,
    LOGIN,
    LOGOUT,
    EXPORTACAO,
    ENCERRAMENTO,
    // V12: acesso autorizado ao denunciante de ocorrencia sigilosa.
    VISUALIZACAO,
    // V27: acesso ao denunciante de ocorrencia sigilosa recusado pela
    // regra de sigilo (download 403 ou detalhe entregue mascarado).
    ACESSO_NEGADO,
    // V29: sessao encerrada pelo sistema por reuso do token de renovacao.
    SESSAO_REVOGADA
}
