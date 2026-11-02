package com.siszoo.usuarios.dto;

import java.util.List;

public record UsuarioAuditoriaSnapshot(
        String nome,
        String sobrenome,
        String crmv,
        List<String> cargos,
        boolean telefoneAlterado) {
}
