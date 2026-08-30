package com.siszoo.usuarios.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record UsuarioResponse(
        UUID id,
        String email,
        String nome,
        String sobrenome,
        List<String> cargos,
        LocalDateTime senhaAlteradaEm) {
}
