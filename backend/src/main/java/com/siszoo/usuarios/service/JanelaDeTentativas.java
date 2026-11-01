package com.siszoo.usuarios.service;

import java.time.Duration;
import java.util.concurrent.atomic.AtomicInteger;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;

// Contador de tentativas por chave em janela fixa, em memoria: o contador
// nasce na primeira chamada e some quando a janela vence. Base dos limites de
// login e de recuperacao de senha. Caffeine ja e dependencia do cache do
// dashboard; nenhuma biblioteca nova.
final class JanelaDeTentativas {

    private static final long MAXIMO_DE_CHAVES = 10_000;

    private final Cache<String, AtomicInteger> contadores;

    JanelaDeTentativas(Duration janela) {
        this.contadores = Caffeine.newBuilder().expireAfterWrite(janela).maximumSize(MAXIMO_DE_CHAVES).build();
    }

    int incrementar(String chave) {
        return contadores.get(chave, ignorada -> new AtomicInteger()).incrementAndGet();
    }

    int contagem(String chave) {
        AtomicInteger contador = contadores.getIfPresent(chave);
        return contador == null ? 0 : contador.get();
    }

    void limpar(String chave) {
        contadores.invalidate(chave);
    }
}
