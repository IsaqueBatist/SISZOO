package com.siszoo.animais.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.siszoo.animais.dto.AtualizarBaiaRequest;
import com.siszoo.animais.dto.AtualizarStatusBaiaRequest;
import com.siszoo.animais.dto.BaiaResponse;
import com.siszoo.animais.dto.CriarBaiaRequest;
import com.siszoo.animais.dto.ResidenteBaiaResponse;
import com.siszoo.animais.service.BaiaService;
import com.siszoo.comum.dto.PaginaResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/baias")
public class BaiaController {

    private final BaiaService baiaService;

    public BaiaController(BaiaService baiaService) {
        this.baiaService = baiaService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('GESTAO_ANIMAIS:leitura')")
    public PaginaResponse<BaiaResponse> listar(
            @RequestParam(required = false) Boolean ativa,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "20") int tamanho) {
        return baiaService.listar(ativa, pagina, tamanho);
    }

    // T45: residentes de todas as baias de uma vez para a Gestao de Baias,
    // em vez de GET /api/animais?tamanho=500 com fotos. Mesma autorizacao das
    // listagens de baias e de animais.
    @GetMapping("/residentes")
    @PreAuthorize("hasAuthority('GESTAO_ANIMAIS:leitura')")
    public List<ResidenteBaiaResponse> listarResidentes() {
        return baiaService.listarResidentes();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('GESTAO_ANIMAIS:leitura')")
    public BaiaResponse buscarPorId(@PathVariable UUID id) {
        return baiaService.buscarPorId(id);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('GESTAO_ANIMAIS:escrita')")
    public BaiaResponse criar(Authentication authentication, @Valid @RequestBody CriarBaiaRequest request) {
        return baiaService.criar(request, usuarioId(authentication));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('GESTAO_ANIMAIS:escrita')")
    public BaiaResponse atualizar(Authentication authentication, @PathVariable UUID id,
            @Valid @RequestBody AtualizarBaiaRequest request) {
        return baiaService.atualizar(id, request, usuarioId(authentication));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('GESTAO_ANIMAIS:escrita')")
    public BaiaResponse alterarStatus(Authentication authentication, @PathVariable UUID id,
            @Valid @RequestBody AtualizarStatusBaiaRequest request) {
        return baiaService.alterarStatus(id, request, usuarioId(authentication));
    }

    /**
     * Executa soft-delete: marca a baia como inativa ({@code ativa=false}).
     * A linha nunca e removida fisicamente. Para reativar, ver
     * {@code PATCH /api/baias/{id}/status}.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('GESTAO_ANIMAIS:exclusao')")
    public BaiaResponse desativar(Authentication authentication, @PathVariable UUID id) {
        return baiaService.desativar(id, usuarioId(authentication));
    }

    private static UUID usuarioId(Authentication authentication) {
        return UUID.fromString(authentication.getName());
    }
}
