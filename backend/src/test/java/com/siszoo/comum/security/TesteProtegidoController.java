package com.siszoo.comum.security;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TesteProtegidoController {

    @GetMapping("/api/teste/protegido")
    @PreAuthorize("hasAuthority('USUARIOS_ACESSO:leitura')")
    public String acessarRecursoProtegido() {
        return "ok";
    }
}
