package com.siszoo.processos.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.siszoo.comum.dto.PaginaResponse;
import com.siszoo.comum.security.UsuarioAutenticado;
import com.siszoo.ocorrencias.service.PermissoesOcorrencia;
import com.siszoo.processos.dto.AlterarStatusProcessoRequest;
import com.siszoo.processos.dto.CatalogosProcessoResponse;
import com.siszoo.processos.dto.CriarProcessoRequest;
import com.siszoo.processos.dto.EditarProcessoRequest;
import com.siszoo.processos.dto.ProcessoResumoResponse;
import com.siszoo.processos.dto.ProcessoSanitarioResponse;
import com.siszoo.processos.dto.RegistrarResultadoRequest;
import com.siszoo.processos.entity.StatusProcesso;
import com.siszoo.processos.service.NotificacaoResultadoService;
import com.siszoo.processos.service.ProcessoSanitarioService;
import com.siszoo.usuarios.dto.AuditoriaEventoResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/processos")
public class ProcessoSanitarioController {

    private final ProcessoSanitarioService processoService;
    private final NotificacaoResultadoService notificacaoResultadoService;

    public ProcessoSanitarioController(
            ProcessoSanitarioService processoService, NotificacaoResultadoService notificacaoResultadoService) {
        this.processoService = processoService;
        this.notificacaoResultadoService = notificacaoResultadoService;
    }

    @PostMapping
    @PreAuthorize("hasAuthority('PROCESSOS_SANITARIOS:escrita')")
    public ProcessoSanitarioResponse criar(Authentication authentication, @Valid @RequestBody CriarProcessoRequest request) {
        return processoService.criar(request, PermissoesOcorrencia.de(authentication));
    }

    @GetMapping
    @PreAuthorize("hasAuthority('PROCESSOS_SANITARIOS:leitura')")
    public PaginaResponse<ProcessoResumoResponse> listar(
            @RequestParam(required = false) String doenca,
            @RequestParam(required = false) List<StatusProcesso> status,
            @RequestParam(required = false) Boolean urgente,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate de,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate ate,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "20") int tamanho) {
        return processoService.listar(doenca, status, urgente, q, de, ate, pagina, tamanho);
    }

    @GetMapping("/catalogos")
    @PreAuthorize("hasAuthority('PROCESSOS_SANITARIOS:leitura')")
    public CatalogosProcessoResponse catalogos() {
        return processoService.catalogos();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('PROCESSOS_SANITARIOS:leitura')")
    public ProcessoSanitarioResponse buscarPorId(@PathVariable UUID id) {
        return processoService.buscarPorId(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('PROCESSOS_SANITARIOS:edicao_registro:escrita')")
    public ProcessoSanitarioResponse editar(
            Authentication authentication, @PathVariable UUID id, @Valid @RequestBody EditarProcessoRequest request) {
        return processoService.editar(id, request, UsuarioAutenticado.id(authentication));
    }

    @GetMapping("/{id}/alteracoes")
    @PreAuthorize("hasAuthority('PROCESSOS_SANITARIOS:edicao_registro:escrita')")
    public List<AuditoriaEventoResponse> alteracoes(@PathVariable UUID id) {
        return processoService.alteracoes(id);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('PROCESSOS_SANITARIOS:escrita')")
    public ProcessoSanitarioResponse alterarStatus(
            Authentication authentication, @PathVariable UUID id, @Valid @RequestBody AlterarStatusProcessoRequest request) {
        return processoService.alterarStatus(id, request, UsuarioAutenticado.id(authentication));
    }

    @PostMapping("/{id}/resultados")
    @PreAuthorize("hasAuthority('PROCESSOS_SANITARIOS:escrita')")
    public ProcessoSanitarioResponse registrarResultado(
            Authentication authentication, @PathVariable UUID id, @Valid @RequestBody RegistrarResultadoRequest request) {
        return processoService.registrarResultado(id, request, UsuarioAutenticado.id(authentication));
    }

    @PostMapping("/{id}/notificacoes/reenviar")
    @PreAuthorize("hasAuthority('PROCESSOS_SANITARIOS:escrita')")
    public ProcessoSanitarioResponse reenviarNotificacao(@PathVariable UUID id) {
        notificacaoResultadoService.reenviarNotificacaoMunicipe(id);
        return processoService.buscarPorId(id);
    }
}
