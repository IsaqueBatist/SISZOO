package com.siszoo.usuarios.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.siszoo.comum.dto.PaginaResponse;
import com.siszoo.usuarios.dto.AuditoriaEventoResponse;
import com.siszoo.usuarios.service.AuditoriaEventoService;

@RestController
@RequestMapping("/api/auditoria")
public class AuditoriaController {

    private final AuditoriaEventoService auditoriaEventoService;

    public AuditoriaController(AuditoriaEventoService auditoriaEventoService) {
        this.auditoriaEventoService = auditoriaEventoService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('USUARIOS_ACESSO:leitura')")
    public PaginaResponse<AuditoriaEventoResponse> listar(
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "20") int tamanho) {
        return auditoriaEventoService.listar(pagina, tamanho);
    }
}
