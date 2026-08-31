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

import com.siszoo.animais.clinico.dto.CriarVacinacaoRequest;
import com.siszoo.animais.clinico.dto.VacinacaoResponse;
import com.siszoo.animais.clinico.service.VacinacaoService;
import com.siszoo.comum.dto.PaginaResponse;

import jakarta.validation.Valid;

// Somente GET/POST: registro clinico imutavel (CLAUDE.md). Nao existe
// @PutMapping/@PatchMapping/@DeleteMapping aqui de proposito — o Spring MVC
// ja devolve 405 para esses verbos nesta rota sem nenhum codigo adicional.
// Correcao = novo POST com `retificaId` (ver CriarVacinacaoRequest).
@RestController
@RequestMapping("/api/vacinacoes")
public class VacinacaoController {

    private final VacinacaoService vacinacaoService;

    public VacinacaoController(VacinacaoService vacinacaoService) {
        this.vacinacaoService = vacinacaoService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('GESTAO_ANIMAIS:leitura')")
    public PaginaResponse<VacinacaoResponse> listar(
            @RequestParam(required = false) UUID animalId,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "20") int tamanho) {
        return vacinacaoService.listar(animalId, pagina, tamanho);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('GESTAO_ANIMAIS:leitura')")
    public VacinacaoResponse buscarPorId(@PathVariable UUID id) {
        return vacinacaoService.buscarPorId(id);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('GESTAO_ANIMAIS:escrita')")
    public VacinacaoResponse criar(Authentication authentication, @Valid @RequestBody CriarVacinacaoRequest request) {
        return vacinacaoService.criar(request, UUID.fromString(authentication.getName()));
    }
}
