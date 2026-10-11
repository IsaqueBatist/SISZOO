package com.siszoo.processos.controller;

import java.util.UUID;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.siszoo.ocorrencias.service.PermissoesOcorrencia;
import com.siszoo.processos.dto.AlterarStatusProcessoRequest;
import com.siszoo.processos.dto.CriarProcessoRequest;
import com.siszoo.processos.dto.ProcessoSanitarioResponse;
import com.siszoo.processos.service.ProcessoSanitarioService;

import jakarta.validation.Valid;

// Processo sanitario minimo (T25). Com ocorrenciaId, o POST tambem exige
// OCORRENCIAS_DENUNCIAS:escrita, checado no service (D33).
@RestController
@RequestMapping("/api/processos")
public class ProcessoSanitarioController {

    private final ProcessoSanitarioService processoService;

    public ProcessoSanitarioController(ProcessoSanitarioService processoService) {
        this.processoService = processoService;
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PROCESSOS_SANITARIOS:escrita')")
    public ProcessoSanitarioResponse criar(Authentication authentication, @Valid @RequestBody CriarProcessoRequest request) {
        return processoService.criar(request, PermissoesOcorrencia.de(authentication));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PROCESSOS_SANITARIOS:leitura')")
    public ProcessoSanitarioResponse buscarPorId(@PathVariable UUID id) {
        return processoService.buscarPorId(id);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('PROCESSOS_SANITARIOS:escrita')")
    public ProcessoSanitarioResponse alterarStatus(
            Authentication authentication, @PathVariable UUID id, @Valid @RequestBody AlterarStatusProcessoRequest request) {
        return processoService.alterarStatus(id, request, UUID.fromString(authentication.getName()));
    }
}
