package com.siszoo.usuarios.controller;

import java.util.UUID;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.siszoo.comum.dto.PaginaResponse;
import com.siszoo.usuarios.dto.AtualizarPerfilRequest;
import com.siszoo.usuarios.dto.AtualizarStatusUsuarioRequest;
import com.siszoo.usuarios.dto.CriarUsuarioRequest;
import com.siszoo.usuarios.dto.UsuarioResponse;
import com.siszoo.usuarios.service.UsuarioService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('USUARIOS_ACESSO:leitura')")
    public PaginaResponse<UsuarioResponse> listar(
            @RequestParam(required = false) String nome,
            @RequestParam(required = false) String cargo,
            @RequestParam(required = false) Boolean ativo,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "20") int tamanho) {
        return usuarioService.listar(nome, cargo, ativo, pagina, tamanho);
    }

    @PostMapping
    @PreAuthorize("hasAuthority('USUARIOS_ACESSO:escrita')")
    public UsuarioResponse criar(@Valid @RequestBody CriarUsuarioRequest request) {
        return usuarioService.criar(request);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('USUARIOS_ACESSO:escrita')")
    public UsuarioResponse alterarStatus(@PathVariable UUID id, @Valid @RequestBody AtualizarStatusUsuarioRequest request) {
        return usuarioService.alterarStatus(id, request);
    }

    @GetMapping("/me")
    public UsuarioResponse buscarPerfilProprio(Authentication authentication) {
        return usuarioService.buscarPorId(UUID.fromString(authentication.getName()));
    }

    @PatchMapping("/me")
    public UsuarioResponse atualizarPerfilProprio(
            Authentication authentication, @Valid @RequestBody AtualizarPerfilRequest request) {
        return usuarioService.atualizarPerfil(UUID.fromString(authentication.getName()), request);
    }
}
