package com.siszoo.comum.util;

import java.time.format.DateTimeFormatter;

public final class Formatadores {

    public static final DateTimeFormatter DATA = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    public static final DateTimeFormatter DATA_HORA = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private Formatadores() {
    }
}
