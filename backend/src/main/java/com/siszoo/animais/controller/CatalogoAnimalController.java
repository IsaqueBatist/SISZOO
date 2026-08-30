package com.siszoo.animais.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.siszoo.animais.dto.CatalogosAnimalResponse;
import com.siszoo.animais.service.CatalogoAnimalService;

@RestController
@RequestMapping("/api/animais/catalogos")
public class CatalogoAnimalController {

    private final CatalogoAnimalService catalogoAnimalService;

    public CatalogoAnimalController(CatalogoAnimalService catalogoAnimalService) {
        this.catalogoAnimalService = catalogoAnimalService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('GESTAO_ANIMAIS:leitura')")
    public CatalogosAnimalResponse listar() {
        return catalogoAnimalService.listar();
    }
}
