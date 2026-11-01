package com.siszoo.relatorios.controller;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.format.annotation.DateTimeFormat.ISO;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.siszoo.comum.dto.PaginaResponse;
import com.siszoo.comum.security.UsuarioAutenticado;
import com.siszoo.relatorios.dto.ArquivoRelatorio;
import com.siszoo.relatorios.dto.ExportarRelatorioRequest;
import com.siszoo.relatorios.dto.FiltroRelatorioBruto;
import com.siszoo.relatorios.dto.RelatorioGeradoResponse;
import com.siszoo.relatorios.dto.TipoRelatorioResponse;
import com.siszoo.relatorios.service.FiltroRelatorioResolver;
import com.siszoo.relatorios.service.RelatorioGeradoService;

// RELATORIOS:leitura e seedado para os 3 perfis (V3__seed_cargos.sql, mesmo
// comentario de DashboardController) - o DER modela a capacidade completa do
// modulo (ver/gerar/exportar relatorios) como "leitura", sem authority de
// escrita separada.
@RestController
@RequestMapping("/api/relatorios")
public class RelatorioController {

    // V32: @PreAuthorize nao le argumentos (PreAuthorizeSemArgumentosTest), e a
    // regra depende do tipo pedido; quem decide e o service.
    private static final String AUTORIDADE_OCORRENCIAS_BAIRRO = "RELATORIOS:ocorrencias_bairro:leitura";

    private final RelatorioGeradoService relatorioGeradoService;
    private final FiltroRelatorioResolver filtroResolver;

    public RelatorioController(RelatorioGeradoService relatorioGeradoService, FiltroRelatorioResolver filtroResolver) {
        this.relatorioGeradoService = relatorioGeradoService;
        this.filtroResolver = filtroResolver;
    }

    @GetMapping("/tipos")
    @PreAuthorize("hasAuthority('RELATORIOS:leitura')")
    public List<TipoRelatorioResponse> tipos(Authentication authentication) {
        return relatorioGeradoService.listarTipos(veOcorrenciasPorBairro(authentication));
    }

    private static boolean veOcorrenciasPorBairro(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(autoridade -> AUTORIDADE_OCORRENCIAS_BAIRRO.equals(autoridade.getAuthority()));
    }

    @GetMapping("/preview")
    @PreAuthorize("hasAuthority('RELATORIOS:leitura')")
    public Object preview(
            Authentication authentication,
            @RequestParam String tipo,
            @RequestParam(required = false) @DateTimeFormat(iso = ISO.DATE) LocalDate periodoInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = ISO.DATE) LocalDate periodoFim,
            @RequestParam(required = false) Integer ano) {
        FiltroRelatorioBruto filtro = new FiltroRelatorioBruto(
                filtroResolver.tipoPorCodigo(tipo), periodoInicio, periodoFim, ano);
        return relatorioGeradoService.preview(filtro, veOcorrenciasPorBairro(authentication));
    }

    @PostMapping("/exportar")
    @PreAuthorize("hasAuthority('RELATORIOS:leitura')")
    public ResponseEntity<byte[]> exportar(@RequestBody ExportarRelatorioRequest request, Authentication authentication) {
        FiltroRelatorioBruto filtro = new FiltroRelatorioBruto(
                filtroResolver.tipoPorCodigo(request.tipo()),
                request.periodoInicio(), request.periodoFim(), request.ano());
        UUID usuarioId = UsuarioAutenticado.id(authentication);

        ArquivoRelatorio arquivo = relatorioGeradoService.exportar(
                filtro, request.formato(), usuarioId, veOcorrenciasPorBairro(authentication));

        ContentDisposition disposicao = ContentDisposition.attachment()
                .filename(arquivo.nomeArquivo(), java.nio.charset.StandardCharsets.UTF_8)
                .build();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(arquivo.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, disposicao.toString())
                .body(arquivo.conteudo());
    }

    @GetMapping("/historico")
    @PreAuthorize("hasAuthority('RELATORIOS:leitura')")
    public PaginaResponse<RelatorioGeradoResponse> historico(
            @RequestParam(defaultValue = "0") int pagina, @RequestParam(defaultValue = "20") int tamanho) {
        return relatorioGeradoService.historico(pagina, tamanho);
    }
}
