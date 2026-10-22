package com.siszoo.usuarios.controller;

import java.time.LocalDate;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.siszoo.comum.dto.PaginaResponse;
import com.siszoo.usuarios.dto.AuditoriaEventoResponse;
import com.siszoo.usuarios.dto.OpcoesFiltroAuditoriaResponse;
import com.siszoo.usuarios.entity.AcaoAuditoria;
import com.siszoo.usuarios.entity.Modulo;
import com.siszoo.usuarios.service.AuditoriaEventoService;

@RestController
@RequestMapping("/api/auditoria")
public class AuditoriaController {

    private final AuditoriaEventoService auditoriaEventoService;

    public AuditoriaController(AuditoriaEventoService auditoriaEventoService) {
        this.auditoriaEventoService = auditoriaEventoService;
    }

    // F2-027 (Fase 3 do TG): filtros opcionais de servidor (docs/contratos/
    // auditoria-filtros.md). Sem parametros, so paginacao, como antes.
    @GetMapping
    @PreAuthorize("hasAuthority('USUARIOS_ACESSO:leitura')")
    public PaginaResponse<AuditoriaEventoResponse> listar(
            @RequestParam(required = false) AcaoAuditoria acao,
            @RequestParam(required = false) String entidade,
            @RequestParam(required = false) String usuarioEmail,
            @RequestParam(required = false) Modulo modulo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate de,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate ate,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "20") int tamanho) {
        return auditoriaEventoService.listar(
                new AuditoriaEventoService.FiltroAuditoria(acao, entidade, usuarioEmail, modulo, de, ate), pagina, tamanho);
    }

    @GetMapping("/filtros")
    @PreAuthorize("hasAuthority('USUARIOS_ACESSO:leitura')")
    public OpcoesFiltroAuditoriaResponse opcoesFiltro() {
        return auditoriaEventoService.opcoesFiltro();
    }
}
