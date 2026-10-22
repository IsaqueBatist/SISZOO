package com.siszoo.comum.util;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;

import org.springframework.stereotype.Component;

// CSV dos relatorios (T41): BOM UTF-8 + separador ";" para abrir corretamente
// no Excel em pt-BR. Sem lib externa (Apache Commons CSV): o formato e simples
// o bastante para StringBuilder, e o jar fica menor (CLAUDE.md: maquinas com
// ~2GB RAM). Escapa por RFC 4180 adaptado ao separador ";" (campo entre aspas
// quando contem ";", aspas ou quebra de linha; aspas internas dobradas). Um
// relatorio com mais de uma secao tabular (a maioria dos 6 tipos) gera varios
// blocos no mesmo arquivo, separados por uma linha em branco.
@Component
public class CsvWriter {

    private static final byte[] BOM_UTF8 = {(byte) 0xEF, (byte) 0xBB, (byte) 0xBF};
    private static final char SEPARADOR = ';';

    public byte[] gerar(List<BlocoCsv> blocos) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < blocos.size(); i++) {
            if (i > 0) {
                sb.append("\r\n");
            }
            BlocoCsv bloco = blocos.get(i);
            escreverLinha(sb, List.of(bloco.titulo()));
            escreverLinha(sb, bloco.cabecalho());
            for (List<String> linha : bloco.linhas()) {
                escreverLinha(sb, linha);
            }
        }

        ByteArrayOutputStream saida = new ByteArrayOutputStream();
        saida.writeBytes(BOM_UTF8);
        saida.writeBytes(sb.toString().getBytes(StandardCharsets.UTF_8));
        return saida.toByteArray();
    }

    private void escreverLinha(StringBuilder sb, List<String> campos) {
        for (int i = 0; i < campos.size(); i++) {
            if (i > 0) {
                sb.append(SEPARADOR);
            }
            sb.append(escapar(campos.get(i)));
        }
        sb.append("\r\n");
    }

    private String escapar(String campo) {
        if (campo == null) {
            return "";
        }
        boolean precisaAspas = campo.indexOf(SEPARADOR) >= 0
                || campo.indexOf('"') >= 0
                || campo.indexOf('\n') >= 0
                || campo.indexOf('\r') >= 0;
        if (!precisaAspas) {
            return campo;
        }
        return "\"" + campo.replace("\"", "\"\"") + "\"";
    }
}
