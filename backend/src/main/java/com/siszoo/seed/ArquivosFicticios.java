package com.siszoo.seed;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

import javax.imageio.ImageIO;

// Arquivos gerados em codigo para fotos e anexos do seed: nenhum arquivo
// binario versionado e nenhuma imagem real. Deterministicos pela cor/texto.
final class ArquivosFicticios {

    private ArquivosFicticios() {
    }

    // Quadrado colorido com um circulo claro: so para a listagem ter miniatura.
    static byte[] png(int rgb) {
        BufferedImage imagem = new BufferedImage(96, 96, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = imagem.createGraphics();
        try {
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            g.setColor(new Color(rgb));
            g.fillRect(0, 0, 96, 96);
            g.setColor(new Color(255, 255, 255, 170));
            g.fillOval(24, 24, 48, 48);
        } finally {
            g.dispose();
        }
        ByteArrayOutputStream saida = new ByteArrayOutputStream();
        try {
            ImageIO.write(imagem, "png", saida);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
        return saida.toByteArray();
    }

    static String fotoDataUri(int rgb) {
        return "data:image/png;base64," + Base64.getEncoder().encodeToString(png(rgb));
    }

    // PDF minimo valido (uma pagina com uma linha de texto ASCII).
    static byte[] pdf(String texto) {
        String conteudo = "BT /F1 12 Tf 72 720 Td (" + texto.replace("(", "").replace(")", "") + ") Tj ET";
        String[] objetos = {
            "<< /Type /Catalog /Pages 2 0 R >>",
            "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
            "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R"
                    + " /Resources << /Font << /F1 5 0 R >> >> >>",
            "<< /Length " + conteudo.length() + " >>\nstream\n" + conteudo + "\nendstream",
            "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
        };
        StringBuilder pdf = new StringBuilder("%PDF-1.4\n");
        int[] posicoes = new int[objetos.length];
        for (int i = 0; i < objetos.length; i++) {
            posicoes[i] = pdf.length();
            pdf.append(i + 1).append(" 0 obj\n").append(objetos[i]).append("\nendobj\n");
        }
        int xref = pdf.length();
        pdf.append("xref\n0 ").append(objetos.length + 1).append("\n0000000000 65535 f \n");
        for (int posicao : posicoes) {
            pdf.append(String.format("%010d 00000 n \n", posicao));
        }
        pdf.append("trailer\n<< /Size ").append(objetos.length + 1).append(" /Root 1 0 R >>\nstartxref\n")
                .append(xref).append("\n%%EOF\n");
        return pdf.toString().getBytes(StandardCharsets.US_ASCII);
    }
}
