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

import com.siszoo.animais.clinico.dto.CriarPrescricaoRequest;
import com.siszoo.animais.clinico.dto.PrescricaoResponse;
import com.siszoo.animais.clinico.service.PrescricaoService;
import com.siszoo.comum.dto.PaginaResponse;

import jakarta.validation.Valid;

// Somente GET/POST: registro clinico imutavel (CLAUDE.md). Ver VacinacaoController.
@RestController
@RequestMapping("/api/prescricoes")
public class PrescricaoController {

    private final PrescricaoService prescricaoService;

    public PrescricaoController(PrescricaoService prescricaoService) {
        this.prescricaoService = prescricaoService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('GESTAO_ANIMAIS:leitura')")
    public PaginaResponse<PrescricaoResponse> listar(
            @RequestParam(required = false) UUID animalId,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "20") int tamanho) {
        return prescricaoService.listar(animalId, pagina, tamanho);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('GESTAO_ANIMAIS:leitura')")
    public PrescricaoResponse buscarPorId(@PathVariable UUID id) {
        return prescricaoService.buscarPorId(id);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('GESTAO_ANIMAIS:escrita')")
    public PrescricaoResponse criar(Authentication authentication, @Valid @RequestBody CriarPrescricaoRequest request) {
        return prescricaoService.criar(request, UUID.fromString(authentication.getName()));
    }
}
