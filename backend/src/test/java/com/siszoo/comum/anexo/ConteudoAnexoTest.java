package com.siszoo.comum.anexo;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.io.IOException;
import java.util.Arrays;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

class ConteudoAnexoTest {

    private static final class AnexoRecusado extends RuntimeException {
    }

    private static MockMultipartFile arquivo(byte[] conteudo) {
        return new MockMultipartFile("arquivo", "nome.bin", "application/octet-stream", conteudo);
    }

    private static byte[] comInicio(int tamanho, int... inicio) {
        byte[] bytes = new byte[tamanho];
        for (int i = 0; i < inicio.length; i++) {
            bytes[i] = (byte) inicio[i];
        }
        return bytes;
    }

    @Test
    void detectaJpegPngEPdfPelosBytesIniciais() {
        assertThat(ConteudoAnexo.validar(arquivo(comInicio(10, 0xFF, 0xD8, 0xFF)), AnexoRecusado::new).mimeType())
                .isEqualTo("image/jpeg");
        assertThat(ConteudoAnexo.validar(arquivo(comInicio(10, 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A)),
                AnexoRecusado::new).mimeType()).isEqualTo("image/png");
        assertThat(ConteudoAnexo.validar(arquivo(comInicio(10, 0x25, 0x50, 0x44, 0x46, 0x2D)), AnexoRecusado::new)
                .mimeType()).isEqualTo("application/pdf");
    }

    @Test
    void devolveOsBytesLidos() {
        byte[] conteudo = comInicio(10, 0xFF, 0xD8, 0xFF);

        assertThat(ConteudoAnexo.validar(arquivo(conteudo), AnexoRecusado::new).conteudo()).isEqualTo(conteudo);
    }

    @Test
    void recusaComAExcecaoDoModuloOTipoDesconhecidoOVazioEOAcimaDe5Mb() {
        assertThatThrownBy(() -> ConteudoAnexo.validar(arquivo("texto qualquer".getBytes()), AnexoRecusado::new))
                .isInstanceOf(AnexoRecusado.class);
        assertThatThrownBy(() -> ConteudoAnexo.validar(arquivo(new byte[0]), AnexoRecusado::new))
                .isInstanceOf(AnexoRecusado.class);
        assertThatThrownBy(() -> ConteudoAnexo.validar(arquivo(new byte[] {(byte) 0xFF, (byte) 0xD8}), AnexoRecusado::new))
                .isInstanceOf(AnexoRecusado.class);

        byte[] limite = comInicio(ConteudoAnexo.TAMANHO_MAXIMO, 0xFF, 0xD8, 0xFF);
        assertThat(ConteudoAnexo.validar(arquivo(limite), AnexoRecusado::new).mimeType()).isEqualTo("image/jpeg");
        byte[] acima = Arrays.copyOf(limite, ConteudoAnexo.TAMANHO_MAXIMO + 1);
        assertThatThrownBy(() -> ConteudoAnexo.validar(arquivo(acima), AnexoRecusado::new))
                .isInstanceOf(AnexoRecusado.class);
    }

    @Test
    void falhaDeLeituraViraAExcecaoDoModulo() throws IOException {
        MultipartFile ilegivel = mock(MultipartFile.class);
        when(ilegivel.getBytes()).thenThrow(new IOException("disco"));

        assertThatThrownBy(() -> ConteudoAnexo.validar(ilegivel, AnexoRecusado::new)).isInstanceOf(AnexoRecusado.class);
    }
}
