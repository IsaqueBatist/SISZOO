package com.siszoo.relatorios.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.siszoo.relatorios.dto.DashboardGraficosResponse;
import com.siszoo.relatorios.dto.DashboardKpisResponse;
import com.siszoo.relatorios.service.DashboardService;

// RELATORIOS:leitura e seedado para os 3 perfis (V3__seed_cargos.sql), todos
// so leitura — e o unico modulo nao editavel por nenhum perfil hoje.
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/kpis")
    @PreAuthorize("hasAuthority('RELATORIOS:leitura')")
    public DashboardKpisResponse kpis() {
        return dashboardService.obterKpis();
    }

    @GetMapping("/graficos")
    @PreAuthorize("hasAuthority('RELATORIOS:leitura')")
    public DashboardGraficosResponse graficos(@RequestParam(required = false) Integer ano) {
        return dashboardService.obterGraficos(ano);
    }
}
