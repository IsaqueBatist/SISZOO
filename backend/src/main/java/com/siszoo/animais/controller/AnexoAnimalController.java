package com.siszoo.animais.controller;

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
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.siszoo.animais.dto.AnexoAnimalResponse;
import com.siszoo.animais.service.AnexoAnimalService;
import com.siszoo.comum.dto.ArquivoAnexo;

// F2-007 / RF-A04: anexos do animal (fotos, laudos, documentos). Sem exclusao
// (historico imutavel). Mesmo contrato dos anexos de ocorrencia.
@RestController
@RequestMapping("/api/animais/{animalId}/anexos")
public class AnexoAnimalController {

    private final AnexoAnimalService anexoAnimalService;

    public AnexoAnimalController(AnexoAnimalService anexoAnimalService) {
        this.anexoAnimalService = anexoAnimalService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('GESTAO_ANIMAIS:leitura')")
    public List<AnexoAnimalResponse> listar(@PathVariable UUID animalId) {
        return anexoAnimalService.listar(animalId);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAuthority('GESTAO_ANIMAIS:escrita')")
    public AnexoAnimalResponse adicionar(
            Authentication authentication,
            @PathVariable UUID animalId,
            @RequestParam("arquivo") MultipartFile arquivo,
            @RequestParam(required = false) String descricao) {
        return anexoAnimalService.adicionar(animalId, arquivo, descricao, UUID.fromString(authentication.getName()));
    }

    @GetMapping("/{anexoId}")
    @PreAuthorize("hasAuthority('GESTAO_ANIMAIS:leitura')")
    public ResponseEntity<byte[]> baixar(@PathVariable UUID animalId, @PathVariable UUID anexoId) {
        ArquivoAnexo arquivo = anexoAnimalService.baixar(animalId, anexoId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(arquivo.mimeType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(arquivo.nome(), StandardCharsets.UTF_8).build().toString())
                .body(arquivo.conteudo());
    }
}
