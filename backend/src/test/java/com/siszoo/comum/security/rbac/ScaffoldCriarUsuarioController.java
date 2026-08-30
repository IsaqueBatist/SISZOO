package com.siszoo.comum.security.rbac;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

// SCAFFOLD T13: existe só em src/test, simula a criação de usuário (Módulo C) para
// provar a matriz RBAC via @PreAuthorize antes de o UsuarioController real existir.
// Reapontar a suíte RbacMatrixIT para o endpoint real de criação de usuário quando ele
// for implementado, e remover este scaffold.
@RestController
public class ScaffoldCriarUsuarioController {

    @PostMapping("/api/teste/rbac/usuarios")
    @PreAuthorize("hasAuthority('USUARIOS_ACESSO:escrita')")
    public ResponseEntity<Void> criarUsuarioSimulado() {
        return ResponseEntity.ok().build();
    }
}
