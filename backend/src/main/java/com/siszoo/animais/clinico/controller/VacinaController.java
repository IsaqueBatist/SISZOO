package com.siszoo.animais.clinico.controller;

import java.util.UUID;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.siszoo.animais.clinico.dto.AtualizarVacinaRequest;
import com.siszoo.animais.clinico.dto.CriarVacinaRequest;
import com.siszoo.animais.clinico.dto.VacinaResponse;
import com.siszoo.animais.clinico.service.VacinaService;
import com.siszoo.comum.dto.PaginaResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/vacinas")
public class VacinaController {

    private final VacinaService vacinaService;

    public VacinaController(VacinaService vacinaService) {
        this.vacinaService = vacinaService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('GESTAO_ANIMAIS:leitura')")
    public PaginaResponse<VacinaResponse> listar(
            @RequestParam(required = false) Boolean ativo,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "20") int tamanho) {
        return vacinaService.listar(ativo, pagina, tamanho);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('GESTAO_ANIMAIS:leitura')")
    public VacinaResponse buscarPorId(@PathVariable UUID id) {
        return vacinaService.buscarPorId(id);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('GESTAO_ANIMAIS:escrita')")
    public VacinaResponse criar(@Valid @RequestBody CriarVacinaRequest request) {
        return vacinaService.criar(request);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('GESTAO_ANIMAIS:escrita')")
    public VacinaResponse atualizar(@PathVariable UUID id, @Valid @RequestBody AtualizarVacinaRequest request) {
        return vacinaService.atualizar(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('GESTAO_ANIMAIS:exclusao')")
    public VacinaResponse desativar(@PathVariable UUID id) {
        return vacinaService.desativar(id);
    }
}
