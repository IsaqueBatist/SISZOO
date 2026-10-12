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
    VISUALIZACAO,
    // T26 (V12): a escrita da resposta de um VISUALIZACAO falhou; compensa o
    // evento original sem altera-lo (auditoria so recebe insercoes).
    ENTREGA_INTERROMPIDA
}
