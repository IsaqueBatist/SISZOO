package com.siszoo.comum.security.rbac;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

// SCAFFOLD: existe só em src/test e simula a criação de usuário para que o
// RbacMatrixIT prove a matriz de cargos de USUARIOS_ACESSO:escrita isolada das
// validações e efeitos do endpoint real (UsuarioController).
@RestController
public class ScaffoldCriarUsuarioController {

    @PostMapping("/api/teste/rbac/usuarios")
    @PreAuthorize("hasAuthority('USUARIOS_ACESSO:escrita')")
    public ResponseEntity<Void> criarUsuarioSimulado() {
        return ResponseEntity.ok().build();
    }
}
