package com.siszoo.ocorrencias.controller;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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
import org.springframework.format.annotation.DateTimeFormat;
import java.time.LocalDate;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.siszoo.comum.dto.ArquivoAnexo;
import com.siszoo.comum.dto.PaginaResponse;
import com.siszoo.ocorrencias.dto.AlterarStatusOcorrenciaRequest;
import com.siszoo.ocorrencias.dto.AnexoOcorrenciaResponse;
import com.siszoo.ocorrencias.dto.AtualizarOcorrenciaRequest;
import com.siszoo.ocorrencias.dto.CatalogosOcorrenciaResponse;
import com.siszoo.ocorrencias.dto.CriarNotaRequest;
import com.siszoo.ocorrencias.dto.CriarOcorrenciaRequest;
import com.siszoo.ocorrencias.dto.EncerrarOcorrenciaRequest;
import com.siszoo.ocorrencias.dto.OcorrenciaResponse;
import com.siszoo.ocorrencias.dto.OcorrenciaResumoResponse;
import com.siszoo.ocorrencias.dto.QuantidadePorBairroResponse;
import com.siszoo.ocorrencias.dto.VincularProcessoRequest;
import com.siszoo.ocorrencias.entity.StatusOcorrencia;
import com.siszoo.ocorrencias.service.OcorrenciaService;
import com.siszoo.ocorrencias.service.PermissoesOcorrencia;

import jakarta.validation.Valid;

// Sem @DeleteMapping de proposito: nao ha exclusao de ocorrencia (D8); o
// Spring MVC responde 405 para DELETE nesta rota.
@RestController
@RequestMapping("/api/ocorrencias")
public class OcorrenciaController {

    private final OcorrenciaService ocorrenciaService;

    public OcorrenciaController(OcorrenciaService ocorrenciaService) {
        this.ocorrenciaService = ocorrenciaService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('OCORRENCIAS_DENUNCIAS:leitura')")
    public PaginaResponse<OcorrenciaResumoResponse> listar(
            Authentication authentication,
            @RequestParam(required = false) String tipo,
            @RequestParam(required = false) StatusOcorrencia status,
            @RequestParam(required = false) String q,
            // F2-010 (RF-E02, Fase 3 do TG): periodo da data de abertura, dias inclusivos
            // (docs/contratos/ocorrencias-filtro-data.md). Sem os parametros, nada muda.
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate de,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate ate,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "20") int tamanho) {
        return ocorrenciaService.listar(tipo, status, q, de, ate, pagina, tamanho, PermissoesOcorrencia.de(authentication));
    }

    @GetMapping("/catalogos")
    @PreAuthorize("hasAuthority('OCORRENCIAS_DENUNCIAS:leitura')")
    public CatalogosOcorrenciaResponse catalogos() {
        return ocorrenciaService.catalogos();
    }

    // T45: mesma autorizacao da listagem, que ja mostra o bairro de toda
    // ocorrencia (inclusive sigilosa) a quem tem leitura do modulo.
    @GetMapping("/estatisticas/bairro")
    @PreAuthorize("hasAuthority('OCORRENCIAS_DENUNCIAS:leitura')")
    public List<QuantidadePorBairroResponse> contarPorBairro() {
        return ocorrenciaService.contarPorBairro();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('OCORRENCIAS_DENUNCIAS:leitura')")
    public OcorrenciaResponse buscarPorId(Authentication authentication, @PathVariable UUID id) {
        return ocorrenciaService.buscarPorId(id, PermissoesOcorrencia.de(authentication));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('OCORRENCIAS_DENUNCIAS:escrita')")
    public OcorrenciaResponse criar(Authentication authentication, @Valid @RequestBody CriarOcorrenciaRequest request) {
        return ocorrenciaService.criar(request, PermissoesOcorrencia.de(authentication));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('OCORRENCIAS_DENUNCIAS:escrita')")
    public OcorrenciaResponse atualizar(
            Authentication authentication, @PathVariable UUID id, @Valid @RequestBody AtualizarOcorrenciaRequest request) {
        return ocorrenciaService.atualizar(id, request, PermissoesOcorrencia.de(authentication));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAuthority('OCORRENCIAS_DENUNCIAS:escrita')")
    public OcorrenciaResponse alterarStatus(
            Authentication authentication, @PathVariable UUID id, @Valid @RequestBody AlterarStatusOcorrenciaRequest request) {
        return ocorrenciaService.alterarStatus(id, request, PermissoesOcorrencia.de(authentication));
    }

    @PostMapping("/{id}/encerramento")
    @PreAuthorize("hasAuthority('OCORRENCIAS_DENUNCIAS:escrita')")
    public OcorrenciaResponse encerrar(
            Authentication authentication, @PathVariable UUID id, @Valid @RequestBody EncerrarOcorrenciaRequest request) {
        return ocorrenciaService.encerrar(id, request, PermissoesOcorrencia.de(authentication));
    }

    @PostMapping("/{id}/processo")
    @PreAuthorize("hasAuthority('OCORRENCIAS_DENUNCIAS:escrita')")
    public OcorrenciaResponse vincularProcesso(
            Authentication authentication, @PathVariable UUID id, @Valid @RequestBody VincularProcessoRequest request) {
        return ocorrenciaService.vincularProcesso(id, request.processoId(), PermissoesOcorrencia.de(authentication));
    }

    @PostMapping("/{id}/notas")
    @PreAuthorize("hasAuthority('OCORRENCIAS_DENUNCIAS:escrita')")
    public OcorrenciaResponse adicionarNota(
            Authentication authentication, @PathVariable UUID id, @Valid @RequestBody CriarNotaRequest request) {
        return ocorrenciaService.adicionarNota(id, request, PermissoesOcorrencia.de(authentication));
    }

    @PostMapping(path = "/{id}/anexos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('OCORRENCIAS_DENUNCIAS:escrita')")
    public AnexoOcorrenciaResponse adicionarAnexo(
            Authentication authentication, @PathVariable UUID id, @RequestParam("arquivo") MultipartFile arquivo) {
        return ocorrenciaService.adicionarAnexo(id, arquivo, PermissoesOcorrencia.de(authentication));
    }

    @GetMapping("/{id}/anexos/{anexoId}")
    @PreAuthorize("hasAuthority('OCORRENCIAS_DENUNCIAS:leitura')")
    public ResponseEntity<byte[]> baixarAnexo(Authentication authentication, @PathVariable UUID id, @PathVariable UUID anexoId) {
        ArquivoAnexo arquivo = ocorrenciaService.baixarAnexo(id, anexoId, PermissoesOcorrencia.de(authentication));
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(arquivo.mimeType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(arquivo.nome(), StandardCharsets.UTF_8).build().toString())
                .body(arquivo.conteudo());
    }
}
