package com.siszoo.comum.security.rbac;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ScaffoldCriarUsuarioController {

    @PostMapping("/api/teste/rbac/usuarios")
    @PreAuthorize("hasAuthority('USUARIOS_ACESSO:escrita')")
    public ResponseEntity<Void> criarUsuarioSimulado() {
        return ResponseEntity.ok().build();
    }
}
