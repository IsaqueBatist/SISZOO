package com.siszoo.animais.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;

import javax.imageio.ImageIO;

import org.junit.jupiter.api.Test;

class MiniaturaFotoTest {

    private final MiniaturaFoto miniaturaFoto = new MiniaturaFoto();

    @Test
    void reduzJpegParaNoMaximo96PxMantendoAProporcao() throws IOException {
        String foto = dataUri("jpeg", imagem(800, 600, BufferedImage.TYPE_INT_RGB));

        String miniatura = miniaturaFoto.gerar(foto);

        assertThat(miniatura).startsWith("data:image/jpeg;base64,");
        BufferedImage lida = ler(miniatura);
        assertThat(lida.getWidth()).isEqualTo(96);
        assertThat(lida.getHeight()).isEqualTo(72);
        assertThat(miniatura.length()).isLessThan(foto.length() / 5);
    }

    @Test
    void pngTransparenteViraJpegComFundoBranco() throws IOException {
        BufferedImage transparente = new BufferedImage(300, 400, BufferedImage.TYPE_INT_ARGB);

        String miniatura = miniaturaFoto.gerar(dataUri("png", transparente));

        BufferedImage lida = ler(miniatura);
        assertThat(lida.getWidth()).isEqualTo(72);
        assertThat(lida.getHeight()).isEqualTo(96);
        Color centro = new Color(lida.getRGB(36, 48));
        assertThat(centro.getRed()).isGreaterThan(240);
        assertThat(centro.getGreen()).isGreaterThan(240);
        assertThat(centro.getBlue()).isGreaterThan(240);
    }

    @Test
    void imagemMenorQueOLimiteNaoEAmpliada() throws IOException {
        String miniatura = miniaturaFoto.gerar(dataUri("png", imagem(40, 30, BufferedImage.TYPE_INT_RGB)));

        BufferedImage lida = ler(miniatura);
        assertThat(lida.getWidth()).isEqualTo(40);
        assertThat(lida.getHeight()).isEqualTo(30);
    }

    @Test
    void urlExternaJaELeveEVoltaComoEsta() {
        assertThat(miniaturaFoto.gerar("https://exemplo.org/foto.jpg")).isEqualTo("https://exemplo.org/foto.jpg");
    }

    @Test
    void semFotoOuFotoIlegivelNaoTemMiniatura() {
        assertThat(miniaturaFoto.gerar(null)).isNull();
        assertThat(miniaturaFoto.gerar("  ")).isNull();
        assertThat(miniaturaFoto.gerar("data:image/png;base64,AAAA")).isNull();
        assertThat(miniaturaFoto.gerar("data:image/png;base64,isto nao e base64")).isNull();
        assertThat(miniaturaFoto.gerar("data:image/png,semBase64")).isNull();
    }

    static BufferedImage imagem(int largura, int altura, int tipo) {
        BufferedImage imagem = new BufferedImage(largura, altura, tipo);
        Graphics2D g = imagem.createGraphics();
        g.setColor(new Color(30, 120, 200));
        g.fillRect(0, 0, largura, altura);
        g.setColor(new Color(240, 180, 20));
        g.fillOval(largura / 4, altura / 4, largura / 2, altura / 2);
        g.dispose();
        return imagem;
    }

    static String dataUri(String formato, BufferedImage imagem) throws IOException {
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        ImageIO.write(imagem, formato, bytes);
        return "data:image/" + formato + ";base64," + Base64.getEncoder().encodeToString(bytes.toByteArray());
    }

    private static BufferedImage ler(String dataUri) throws IOException {
        String base64 = dataUri.substring(dataUri.indexOf(";base64,") + ";base64,".length());
        return ImageIO.read(new ByteArrayInputStream(Base64.getDecoder().decode(base64)));
    }
}
