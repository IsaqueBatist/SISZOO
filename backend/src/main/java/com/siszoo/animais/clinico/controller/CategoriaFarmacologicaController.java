package com.siszoo.animais.clinico.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.siszoo.animais.clinico.dto.CategoriaFarmacologicaResponse;
import com.siszoo.animais.clinico.dto.CriarCategoriaFarmacologicaRequest;
import com.siszoo.animais.clinico.service.CategoriaFarmacologicaService;

import jakarta.validation.Valid;

// Mesmas permissoes de /api/medicamentos: quem cadastra medicamento precisa
// poder cadastrar a categoria dele.
@RestController
@RequestMapping("/api/categorias-farmacologicas")
public class CategoriaFarmacologicaController {

    private final CategoriaFarmacologicaService categoriaFarmacologicaService;

    public CategoriaFarmacologicaController(CategoriaFarmacologicaService categoriaFarmacologicaService) {
        this.categoriaFarmacologicaService = categoriaFarmacologicaService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('GESTAO_ANIMAIS:leitura')")
    public List<CategoriaFarmacologicaResponse> listar() {
        return categoriaFarmacologicaService.listarAtivas();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('GESTAO_ANIMAIS:escrita')")
    public CategoriaFarmacologicaResponse criar(@Valid @RequestBody CriarCategoriaFarmacologicaRequest request) {
        return categoriaFarmacologicaService.criar(request);
    }
}
