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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.siszoo.comum.dto.PaginaResponse;
import com.siszoo.ocorrencias.service.PermissoesOcorrencia;
import com.siszoo.processos.dto.AlterarStatusProcessoRequest;
import com.siszoo.processos.dto.CatalogosProcessoResponse;
import com.siszoo.processos.dto.CriarProcessoRequest;
import com.siszoo.processos.dto.ProcessoResumoResponse;
import com.siszoo.processos.dto.ProcessoSanitarioResponse;
import com.siszoo.processos.dto.RegistrarResultadoRequest;
import com.siszoo.processos.entity.StatusProcesso;
import com.siszoo.processos.service.NotificacaoResultadoService;
import com.siszoo.processos.service.ProcessoSanitarioService;

import jakarta.validation.Valid;

// Processo sanitario (T25 + T29 + T32 + T34 + T37): criacao completa,
// listagem, detalhe, catalogos, avanco de status e registro do resultado
// laboratorial (com desfecho do animal e notificacao ao municipe). Com
// ocorrenciaId, o POST tambem exige OCORRENCIAS_DENUNCIAS:escrita, checado no
// service (D33). Resultado e imutavel: sem PUT/PATCH/DELETE em /resultados;
// a correcao e um novo POST com retificaId. O historico completo (original +
// correcoes) vem embutido em GET /{id} (ProcessoSanitarioResponse.resultados).
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
            @RequestParam(required = false) StatusProcesso status,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "20") int tamanho) {
        return processoService.listar(doenca, status, pagina, tamanho);
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

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('PROCESSOS_SANITARIOS:escrita')")
    public ProcessoSanitarioResponse alterarStatus(
            Authentication authentication, @PathVariable UUID id, @Valid @RequestBody AlterarStatusProcessoRequest request) {
        return processoService.alterarStatus(id, request, UUID.fromString(authentication.getName()));
    }

    @PostMapping("/{id}/resultados")
    @PreAuthorize("hasAuthority('PROCESSOS_SANITARIOS:escrita')")
    public ProcessoSanitarioResponse registrarResultado(
            Authentication authentication, @PathVariable UUID id, @Valid @RequestBody RegistrarResultadoRequest request) {
        return processoService.registrarResultado(id, request, UUID.fromString(authentication.getName()));
    }

    // Reenvio manual da notificacao ao municipe (pendencia da T35): so com
    // resultado positivo vigente e sem data de notificacao ainda gravada
    // (422 nos dois casos — NotificacaoResultadoService). O envio continua
    // assincrono; a resposta reflete o processo no instante da chamada.
    @PostMapping("/{id}/notificacoes/reenviar")
    @PreAuthorize("hasAuthority('PROCESSOS_SANITARIOS:escrita')")
    public ProcessoSanitarioResponse reenviarNotificacao(@PathVariable UUID id) {
        notificacaoResultadoService.reenviarNotificacaoMunicipe(id);
        return processoService.buscarPorId(id);
    }
}
