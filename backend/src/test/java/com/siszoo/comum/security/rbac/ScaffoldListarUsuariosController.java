package com.siszoo.comum.security.rbac;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

// SCAFFOLD T13: existe só em src/test, simula a leitura/gestão de usuários para
// provar a matriz RBAC via @PreAuthorize antes de o UsuarioController real existir.
// Reapontar a suíte RbacMatrixIT para o endpoint real de listagem de usuário quando ele
// for implementado, e remover este scaffold.
@RestController
public class ScaffoldListarUsuariosController {

    @GetMapping("/api/teste/rbac/usuarios")
    @PreAuthorize("hasAuthority('USUARIOS_ACESSO:leitura')")
    public ResponseEntity<Void> listarUsuariosSimulado() {
        return ResponseEntity.ok().build();
    }
}
