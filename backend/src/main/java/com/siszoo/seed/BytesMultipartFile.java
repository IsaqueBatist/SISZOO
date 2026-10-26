package com.siszoo.seed;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;

import org.springframework.web.multipart.MultipartFile;

// Arquivo em memoria para chamar os services de anexo como o upload do
// controller faria (MockMultipartFile so existe no classpath de teste).
record BytesMultipartFile(String nomeOriginal, String tipo, byte[] conteudo) implements MultipartFile {

    @Override
    public String getName() {
        return "arquivo";
    }

    @Override
    public String getOriginalFilename() {
        return nomeOriginal;
    }

    @Override
    public String getContentType() {
        return tipo;
    }

    @Override
    public boolean isEmpty() {
        return conteudo.length == 0;
    }

    @Override
    public long getSize() {
        return conteudo.length;
    }

    @Override
    public byte[] getBytes() {
        return conteudo.clone();
    }

    @Override
    public InputStream getInputStream() {
        return new ByteArrayInputStream(conteudo);
    }

    @Override
    public void transferTo(File destino) throws IOException {
        Files.write(destino.toPath(), conteudo);
    }
}
