package com.siszoo.usuarios.dto;

import java.util.List;

// Snapshot da edicao de usuario pelo Administrador. O telefone nao entra, como
// no perfil proprio: a auditoria e imutavel, e so o fato de ter mudado
// fica registrado, em telefoneAlterado.
public record UsuarioAuditoriaSnapshot(
        String nome,
        String sobrenome,
        String crmv,
        List<String> cargos,
        boolean telefoneAlterado) {
}
