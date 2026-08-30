package com.siszoo.usuarios.entity;

public enum AcaoAuditoria {
    CRIACAO,
    ATUALIZACAO,
    DESATIVACAO,
    REATIVACAO,
    LOGIN,
    LOGOUT,
    EXPORTACAO,
    ENCERRAMENTO;

    // TODO: falta valor "VISUALIZACAO" p/ auditoria LGPD de acesso a denunciante sigiloso (docs/DER.md:683)
}
