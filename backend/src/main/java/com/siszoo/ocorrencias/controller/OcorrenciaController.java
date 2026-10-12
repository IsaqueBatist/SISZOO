package com.siszoo.ocorrencias.controller;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
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
import org.springframework.web.multipart.MultipartFile;

import com.siszoo.comum.dto.PaginaResponse;
import com.siszoo.ocorrencias.dto.AlterarStatusOcorrenciaRequest;
import com.siszoo.ocorrencias.dto.AnexoOcorrenciaResponse;
import com.siszoo.ocorrencias.dto.ArquivoAnexo;
import com.siszoo.ocorrencias.dto.AtualizarOcorrenciaRequest;
import com.siszoo.ocorrencias.dto.CatalogosOcorrenciaResponse;
import com.siszoo.ocorrencias.dto.CriarNotaRequest;
import com.siszoo.ocorrencias.dto.CriarOcorrenciaRequest;
import com.siszoo.ocorrencias.dto.EncerrarOcorrenciaRequest;
import com.siszoo.ocorrencias.dto.EntregaAuditada;
import com.siszoo.ocorrencias.dto.OcorrenciaResponse;
import com.siszoo.ocorrencias.dto.OcorrenciaResumoResponse;
import com.siszoo.ocorrencias.dto.VincularProcessoRequest;
import com.siszoo.ocorrencias.dto.VisualizacaoAuditada;
import com.siszoo.ocorrencias.entity.StatusOcorrencia;
import com.siszoo.ocorrencias.service.OcorrenciaService;
import com.siszoo.ocorrencias.service.PermissoesOcorrencia;

import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import tools.jackson.databind.ObjectMapper;

// Sem @DeleteMapping de proposito: nao ha exclusao de ocorrencia (D8); o
// Spring MVC responde 405 para DELETE nesta rota.
@RestController
@RequestMapping("/api/ocorrencias")
public class OcorrenciaController {

    private final OcorrenciaService ocorrenciaService;
    private final ObjectMapper objectMapper;

    public OcorrenciaController(OcorrenciaService ocorrenciaService, ObjectMapper objectMapper) {
        this.ocorrenciaService = ocorrenciaService;
        this.objectMapper = objectMapper;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('OCORRENCIAS_DENUNCIAS:leitura')")
    public PaginaResponse<OcorrenciaResumoResponse> listar(
            Authentication authentication,
            @RequestParam(required = false) String tipo,
            @RequestParam(required = false) StatusOcorrencia status,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "20") int tamanho) {
        return ocorrenciaService.listar(tipo, status, q, pagina, tamanho, PermissoesOcorrencia.de(authentication));
    }

    @GetMapping("/catalogos")
    @PreAuthorize("hasAuthority('OCORRENCIAS_DENUNCIAS:leitura')")
    public CatalogosOcorrenciaResponse catalogos() {
        return ocorrenciaService.catalogos();
    }

    // Detalhe e download escrevem o corpo aqui (e nao pelo retorno do metodo)
    // para saber se a escrita falhou depois do VISUALIZACAO ja commitado (T26).
    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('OCORRENCIAS_DENUNCIAS:leitura')")
    public void buscarPorId(Authentication authentication, @PathVariable UUID id, HttpServletResponse response)
            throws IOException {
        PermissoesOcorrencia permissoes = PermissoesOcorrencia.de(authentication);
        EntregaAuditada<OcorrenciaResponse> entrega = ocorrenciaService.buscarPorId(id, permissoes);
        entregar(response, entrega.visualizacao(), permissoes, resposta -> {
            byte[] json = objectMapper.writeValueAsBytes(entrega.conteudo());
            resposta.setContentType(MediaType.APPLICATION_JSON_VALUE);
            resposta.setContentLength(json.length);
            resposta.getOutputStream().write(json);
        });
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
    public void baixarAnexo(Authentication authentication, @PathVariable UUID id, @PathVariable UUID anexoId,
            HttpServletResponse response) throws IOException {
        PermissoesOcorrencia permissoes = PermissoesOcorrencia.de(authentication);
        EntregaAuditada<ArquivoAnexo> entrega = ocorrenciaService.baixarAnexo(id, anexoId, permissoes);
        ArquivoAnexo arquivo = entrega.conteudo();
        entregar(response, entrega.visualizacao(), permissoes, resposta -> {
            resposta.setContentType(arquivo.mimeType());
            resposta.setHeader(HttpHeaders.CONTENT_DISPOSITION,
                    ContentDisposition.attachment().filename(arquivo.nome(), StandardCharsets.UTF_8).build().toString());
            resposta.setContentLength(arquivo.conteudo().length);
            resposta.getOutputStream().write(arquivo.conteudo());
        });
    }

    // Escreve e descarrega o corpo inteiro. Se algo falhar nesse trecho
    // (serializacao, cliente desconectado), o VISUALIZACAO ja gravado ganha o
    // evento compensatorio ENTREGA_INTERROMPIDA; a excecao original segue,
    // com a eventual falha da compensacao anexada como suppressed. O servidor
    // so sabe que escreveu no socket, nao que o cliente leu tudo.
    private void entregar(HttpServletResponse response, VisualizacaoAuditada visualizacao,
            PermissoesOcorrencia permissoes, EscritaDoCorpo escrita) throws IOException {
        try {
            escrita.escrever(response);
            response.flushBuffer();
        } catch (IOException | RuntimeException falhaNaEntrega) {
            if (visualizacao != null) {
                try {
                    ocorrenciaService.registrarEntregaInterrompida(visualizacao, permissoes);
                } catch (RuntimeException falhaNaCompensacao) {
                    falhaNaEntrega.addSuppressed(falhaNaCompensacao);
                }
            }
            throw falhaNaEntrega;
        }
    }

    @FunctionalInterface
    private interface EscritaDoCorpo {
        void escrever(HttpServletResponse response) throws IOException;
    }
}
