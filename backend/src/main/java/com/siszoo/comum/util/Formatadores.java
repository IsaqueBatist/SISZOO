package com.siszoo.comum.util;

import java.time.format.DateTimeFormatter;

// Formatos PT-BR unicos do sistema (CLAUDE.md: "data DD/MM/AAAA ... fixos"),
// reaproveitados por CsvWriter, PdfRelatorioRenderer e os services de
// relatorio para nao duplicar o padrao em cada lugar que formata data/hora.
public final class Formatadores {

    public static final DateTimeFormatter DATA = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    public static final DateTimeFormatter DATA_HORA = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private Formatadores() {
    }
}
