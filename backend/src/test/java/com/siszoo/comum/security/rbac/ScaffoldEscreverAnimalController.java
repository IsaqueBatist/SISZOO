package com.siszoo.comum.security.rbac;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

// SCAFFOLD T13: existe só em src/test, simula a escrita no módulo de animais/canil
// (Módulo A) para provar a matriz RBAC via @PreAuthorize antes de o AnimalController
// real existir. Reapontar a suíte RbacMatrixIT para o endpoint real de criação/edição
// de animal quando ele for implementado, e remover este scaffold.
@RestController
public class ScaffoldEscreverAnimalController {

    @PostMapping("/api/teste/rbac/animais")
    @PreAuthorize("hasAuthority('GESTAO_ANIMAIS:escrita')")
    public ResponseEntity<Void> escreverAnimalSimulado() {
        return ResponseEntity.ok().build();
    }
}
