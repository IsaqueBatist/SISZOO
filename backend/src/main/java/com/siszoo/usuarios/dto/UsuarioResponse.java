package com.siszoo.usuarios.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record UsuarioResponse(
        UUID id,
        String email,
        String nome,
        String sobrenome,
        String crmv,
        List<String> cargos,
        boolean ativo,
        LocalDateTime ultimoAcesso,
        LocalDateTime criadoEm,
        LocalDateTime senhaAlteradaEm,
        String telefone) {

    // Para o evento de CRIACAO: a auditoria e imutavel e o telefone nao entra
    // nela (T43).
    public UsuarioResponse semTelefone() {
        return new UsuarioResponse(id, email, nome, sobrenome, crmv, cargos, ativo, ultimoAcesso, criadoEm,
                senhaAlteradaEm, null);
    }
}
