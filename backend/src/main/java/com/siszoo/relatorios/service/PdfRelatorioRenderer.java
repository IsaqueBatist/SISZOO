package com.siszoo.relatorios.service;

import java.io.ByteArrayOutputStream;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.xhtmlrenderer.pdf.ITextFontResolver;
import org.xhtmlrenderer.pdf.ITextRenderer;

import com.siszoo.relatorios.dto.MetadadosDocumento;
import com.siszoo.relatorios.entity.TipoRelatorio;

// Flying Saucer (org.xhtmlrenderer:flying-saucer-pdf-openpdf, PDF via OpenPDF)
// renderiza o HTML do template Thymeleaf para PDF. Escolhida sobre openhtmltopdf
// por instrucao do enunciado da T41 na ausencia de ganho concreto entre as
// duas (ambas sem release ha anos — ver comentario no pom.xml). O template de
// cada tipo e identificado pelo codigo do enum (ex.: "vacinacao.html"); o CSS
// e as fontes (Lato/IBM Plex Mono, embutidas) ficam embutidos no proprio
// template via fragmento (_fragmentos.html), nunca referenciados por URL
// externa — a internet do CCZ e instavel (CLAUDE.md).
@Component
public class PdfRelatorioRenderer {

    private static final String[] FONTES = {
            "/fonts/Lato-Regular.ttf",
            "/fonts/Lato-Bold.ttf",
            "/fonts/IBMPlexMono-Regular.ttf",
            "/fonts/IBMPlexMono-Bold.ttf"
    };

    private final TemplateEngine templateEngineRelatorios;

    public PdfRelatorioRenderer(@Qualifier("templateEngineRelatorios") TemplateEngine templateEngineRelatorios) {
        this.templateEngineRelatorios = templateEngineRelatorios;
    }

    public byte[] renderizar(TipoRelatorio tipo, Object dados, MetadadosDocumento metadados) {
        Context contexto = new Context();
        contexto.setVariable("d", dados);
        contexto.setVariable("meta", metadados);
        String html = templateEngineRelatorios.process(tipo.codigo(), contexto);

        try {
            ITextRenderer renderer = new ITextRenderer();
            registrarFontes(renderer.getFontResolver());
            renderer.setDocumentFromString(html);
            renderer.layout();

            ByteArrayOutputStream saida = new ByteArrayOutputStream();
            renderer.createPDF(saida);
            return saida.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao gerar PDF do relatório " + tipo.codigo(), e);
        }
    }

    private void registrarFontes(ITextFontResolver fontResolver) throws Exception {
        for (String caminho : FONTES) {
            fontResolver.addFont(getClass().getResource(caminho).toExternalForm(), true);
        }
    }
}
