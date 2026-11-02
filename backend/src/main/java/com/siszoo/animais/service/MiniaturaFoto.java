package com.siszoo.animais.service;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.Iterator;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.MemoryCacheImageOutputStream;

import org.springframework.stereotype.Component;

@Component
public class MiniaturaFoto {

    static final int LADO_MAXIMO = 96;
    private static final float QUALIDADE_JPEG = 0.8f;
    private static final String PREFIXO_DATA_URI = "data:";
    private static final String MARCA_BASE64 = ";base64,";

    public String gerar(String fotoUrl) {
        if (fotoUrl == null || fotoUrl.isBlank()) {
            return null;
        }
        if (!fotoUrl.startsWith(PREFIXO_DATA_URI)) {
            return fotoUrl;
        }
        int inicioDados = fotoUrl.indexOf(MARCA_BASE64);
        if (inicioDados < 0) {
            return null;
        }
        try {
            byte[] original = Base64.getDecoder().decode(fotoUrl.substring(inicioDados + MARCA_BASE64.length()));
            BufferedImage imagem = ImageIO.read(new ByteArrayInputStream(original));
            if (imagem == null) {
                return null;
            }
            return "data:image/jpeg;base64," + Base64.getEncoder().encodeToString(jpeg(reduzir(imagem)));
        } catch (IllegalArgumentException | IOException e) {
            return null;
        }
    }

    private static BufferedImage reduzir(BufferedImage imagem) {
        double escala = Math.min(1.0, (double) LADO_MAXIMO / Math.max(imagem.getWidth(), imagem.getHeight()));
        int largura = Math.max(1, (int) Math.round(imagem.getWidth() * escala));
        int altura = Math.max(1, (int) Math.round(imagem.getHeight() * escala));
        BufferedImage reduzida = new BufferedImage(largura, altura, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = reduzida.createGraphics();
        try {
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            g.setColor(Color.WHITE);
            g.fillRect(0, 0, largura, altura);
            g.drawImage(imagem, 0, 0, largura, altura, null);
        } finally {
            g.dispose();
        }
        return reduzida;
    }

    private static byte[] jpeg(BufferedImage imagem) throws IOException {
        Iterator<ImageWriter> escritores = ImageIO.getImageWritersByFormatName("jpeg");
        ImageWriter escritor = escritores.next();
        ImageWriteParam parametros = escritor.getDefaultWriteParam();
        parametros.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
        parametros.setCompressionQuality(QUALIDADE_JPEG);
        ByteArrayOutputStream saida = new ByteArrayOutputStream();
        try (MemoryCacheImageOutputStream destino = new MemoryCacheImageOutputStream(saida)) {
            escritor.setOutput(destino);
            escritor.write(null, new IIOImage(imagem, null, null), parametros);
        } finally {
            escritor.dispose();
        }
        return saida.toByteArray();
    }
}
