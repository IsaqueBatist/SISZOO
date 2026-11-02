package com.siszoo.comum.security.rbac;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ScaffoldListarUsuariosController {

    @GetMapping("/api/teste/rbac/usuarios")
    @PreAuthorize("hasAuthority('USUARIOS_ACESSO:leitura')")
    public ResponseEntity<Void> listarUsuariosSimulado() {
        return ResponseEntity.ok().build();
    }
}
