package com.siszoo.comum.anexo;

import java.io.IOException;
import java.util.function.Supplier;

import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

public final class ConteudoAnexo {

    public static final int TAMANHO_MAXIMO = 5 * 1024 * 1024;
    public static final int TAMANHO_MAXIMO_NOME = 255;

    private ConteudoAnexo() {
    }

    public record Validado(byte[] conteudo, String mimeType) {
    }

    public static Validado validar(MultipartFile arquivo, Supplier<? extends RuntimeException> invalido) {
        byte[] conteudo = ler(arquivo, invalido);
        if (conteudo.length == 0 || conteudo.length > TAMANHO_MAXIMO) {
            throw invalido.get();
        }
        return new Validado(conteudo, detectarTipo(conteudo, invalido));
    }

    public static String nomeDoArquivo(String original) {
        String nome = StringUtils.hasText(original) ? StringUtils.getFilename(original.replace('\\', '/')) : null;
        nome = StringUtils.hasText(nome) ? nome.trim() : "anexo";
        return nome.length() > TAMANHO_MAXIMO_NOME ? nome.substring(0, TAMANHO_MAXIMO_NOME) : nome;
    }

    private static byte[] ler(MultipartFile arquivo, Supplier<? extends RuntimeException> invalido) {
        try {
            return arquivo.getBytes();
        } catch (IOException e) {
            throw invalido.get();
        }
    }

    private static String detectarTipo(byte[] conteudo, Supplier<? extends RuntimeException> invalido) {
        if (comecaCom(conteudo, 0xFF, 0xD8, 0xFF)) {
            return "image/jpeg";
        }
        if (comecaCom(conteudo, 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A)) {
            return "image/png";
        }
        if (comecaCom(conteudo, 0x25, 0x50, 0x44, 0x46, 0x2D)) {
            return "application/pdf";
        }
        throw invalido.get();
    }

    private static boolean comecaCom(byte[] conteudo, int... assinatura) {
        if (conteudo.length < assinatura.length) {
            return false;
        }
        for (int i = 0; i < assinatura.length; i++) {
            if ((conteudo[i] & 0xFF) != assinatura[i]) {
                return false;
            }
        }
        return true;
    }
}
