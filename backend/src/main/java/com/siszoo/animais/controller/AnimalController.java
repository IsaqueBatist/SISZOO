package com.siszoo.animais.controller;

import java.util.UUID;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.siszoo.animais.dto.AnimalResponse;
import com.siszoo.animais.dto.AtualizarAnimalRequest;
import com.siszoo.animais.dto.CriarAnimalRequest;
import com.siszoo.animais.service.AnimalService;
import com.siszoo.comum.dto.PaginaResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/animais")
public class AnimalController {

    private final AnimalService animalService;

    public AnimalController(AnimalService animalService) {
        this.animalService = animalService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('GESTAO_ANIMAIS:leitura')")
    public PaginaResponse<AnimalResponse> listar(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String especie,
            @RequestParam(required = false) UUID baiaId,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "20") int tamanho) {
        return animalService.listar(status, especie, baiaId, q, pagina, tamanho);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('GESTAO_ANIMAIS:leitura')")
    public AnimalResponse buscarPorId(@PathVariable UUID id) {
        return animalService.buscarPorId(id);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('GESTAO_ANIMAIS:escrita')")
    public AnimalResponse criar(Authentication authentication, @Valid @RequestBody CriarAnimalRequest request) {
        return animalService.criar(request, UUID.fromString(authentication.getName()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('GESTAO_ANIMAIS:escrita')")
    public AnimalResponse atualizar(@PathVariable UUID id, @Valid @RequestBody AtualizarAnimalRequest request) {
        return animalService.atualizar(id, request);
    }
}
