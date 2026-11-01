package com.siszoo.comum.util;

import java.util.List;
import java.util.OptionalDouble;

public final class Estatisticas {

    private Estatisticas() {
    }

    public static Double mediaComUmaCasa(List<Double> valores) {
        if (valores == null || valores.isEmpty()) {
            return null;
        }
        OptionalDouble media = valores.stream().mapToDouble(Double::doubleValue).average();
        return media.isPresent() ? Math.round(media.getAsDouble() * 10.0) / 10.0 : null;
    }
}
