package com.siszoo.comum.security;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

// Existe só em src/test: exercita o mecanismo de autorização sem criar endpoint de negócio.
@RestController
public class TesteProtegidoController {

    @GetMapping("/api/teste/protegido")
    @PreAuthorize("hasAuthority('USUARIOS_ACESSO:leitura')")
    public String acessarRecursoProtegido() {
        return "ok";
    }
}
