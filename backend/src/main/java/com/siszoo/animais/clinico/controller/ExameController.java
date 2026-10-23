package com.siszoo.animais.clinico.controller;

import java.util.UUID;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.siszoo.animais.clinico.dto.CriarExameRequest;
import com.siszoo.animais.clinico.dto.ExameResponse;
import com.siszoo.animais.clinico.service.ExameService;
import com.siszoo.comum.dto.PaginaResponse;

import jakarta.validation.Valid;

// F2-007 / RF-A04. Somente GET/POST: registro clinico imutavel (RN06); nao
// existe PUT/PATCH/DELETE de proposito (405 do Spring MVC). Correcao = novo
// POST com `retificaId` (ver CriarExameRequest).
@RestController
@RequestMapping("/api/exames")
public class ExameController {

    private final ExameService exameService;

    public ExameController(ExameService exameService) {
        this.exameService = exameService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('GESTAO_ANIMAIS:leitura')")
    public PaginaResponse<ExameResponse> listar(
            @RequestParam(required = false) UUID animalId,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "20") int tamanho) {
        return exameService.listar(animalId, pagina, tamanho);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('GESTAO_ANIMAIS:leitura')")
    public ExameResponse buscarPorId(@PathVariable UUID id) {
        return exameService.buscarPorId(id);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('GESTAO_ANIMAIS:escrita')")
    public ExameResponse criar(Authentication authentication, @Valid @RequestBody CriarExameRequest request) {
        return exameService.criar(request, UUID.fromString(authentication.getName()));
    }
}
