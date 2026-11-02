package com.siszoo.usuarios.dto;

import java.util.List;

import com.siszoo.usuarios.entity.AcaoAuditoria;
import com.siszoo.usuarios.entity.Modulo;

public record OpcoesFiltroAuditoriaResponse(
        List<AcaoAuditoria> acoes,
        List<String> usuarios,
        List<Modulo> modulos) {
}
