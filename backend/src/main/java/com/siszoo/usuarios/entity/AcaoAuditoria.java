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
    // T26 (V12): acesso autorizado ao denunciante de ocorrencia sigilosa.
    VISUALIZACAO
}
