package com.siszoo.alertas.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.siszoo.alertas.dto.AlertaEsterilizacaoAnimalResponse;
import com.siszoo.alertas.service.AlertaEsterilizacaoService;

@RestController
@RequestMapping("/api/alertas/esterilizacao")
public class AlertaEsterilizacaoController {

    private final AlertaEsterilizacaoService alertaEsterilizacaoService;

    public AlertaEsterilizacaoController(AlertaEsterilizacaoService alertaEsterilizacaoService) {
        this.alertaEsterilizacaoService = alertaEsterilizacaoService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('GESTAO_ANIMAIS:leitura')")
    public List<AlertaEsterilizacaoAnimalResponse> listar() {
        return alertaEsterilizacaoService.listarAlertasEsterilizacao();
    }
}
