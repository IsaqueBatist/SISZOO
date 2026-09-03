package com.siszoo.alertas.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.siszoo.alertas.dto.AlertaVacinalAnimalResponse;
import com.siszoo.alertas.service.AlertaVacinalService;

@RestController
@RequestMapping("/api/alertas/vacinas")
public class AlertaVacinalController {

    private final AlertaVacinalService alertaVacinalService;

    public AlertaVacinalController(AlertaVacinalService alertaVacinalService) {
        this.alertaVacinalService = alertaVacinalService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('GESTAO_ANIMAIS:leitura')")
    public List<AlertaVacinalAnimalResponse> listar() {
        return alertaVacinalService.listarAlertasVacinais();
    }
}
