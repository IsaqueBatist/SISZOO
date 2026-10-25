package com.siszoo.seed;

import java.util.Map;
import java.util.stream.Collectors;

// Resultado de uma execucao do seed: por entidade, quantos agregados foram
// criados agora e quantos ja existiam (pulados).
public record ResumoSeed(Map<String, Contagem> porEntidade) {

    public record Contagem(int criados, int existentes) {
    }

    public int criados() {
        return porEntidade.values().stream().mapToInt(Contagem::criados).sum();
    }

    public int existentes() {
        return porEntidade.values().stream().mapToInt(Contagem::existentes).sum();
    }

    @Override
    public String toString() {
        return porEntidade.entrySet().stream()
                .map(e -> e.getKey() + "=" + e.getValue().criados() + "/" + e.getValue().existentes())
                .collect(Collectors.joining(", ", "criados/existentes por entidade: ", ""));
    }
}
