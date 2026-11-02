package com.siszoo.usuarios.dto;

import java.util.List;

import com.siszoo.usuarios.entity.AcaoAuditoria;
import com.siszoo.usuarios.entity.Modulo;

// Valores distintos para os filtros da tela de Logs,
// calculados no servidor sobre toda a trilha (nao so sobre a pagina atual).
public record OpcoesFiltroAuditoriaResponse(
        List<AcaoAuditoria> acoes,
        List<String> usuarios,
        List<Modulo> modulos) {
}
