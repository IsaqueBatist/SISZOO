package com.siszoo.ocorrencias.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import com.siszoo.ocorrencias.dto.OrigemAnimalResponse;
import com.siszoo.ocorrencias.service.OcorrenciaConsultaService;

@RestController
public class OrigemAnimalController {

    private final OcorrenciaConsultaService consultaService;

    public OrigemAnimalController(OcorrenciaConsultaService consultaService) {
        this.consultaService = consultaService;
    }

    @GetMapping("/api/animais/{id}/origem")
    @PreAuthorize("hasAuthority('GESTAO_ANIMAIS:leitura')")
    public List<OrigemAnimalResponse> listar(@PathVariable UUID id) {
        return consultaService.listarOrigemDoAnimal(id);
    }
}
