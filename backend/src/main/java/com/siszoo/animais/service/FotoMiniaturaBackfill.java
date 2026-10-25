package com.siszoo.animais.service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

// Gera a miniatura (V28, T45) das fotos gravadas antes dela existir. Roda uma
// vez a cada subida, em segundo plano (executor do @EnableAsync), para nao
// atrasar o startup; ate terminar, a listagem mostra o avatar sem foto desses
// animais. Idempotente: so toca linhas com foto e sem miniatura, e o UPDATE
// nao sobrescreve uma miniatura gravada no meio do caminho por uma edicao.
//
// Coluna tecnica derivada da foto, sem mudanca de dado de negocio: por isso
// nao gera evento de auditoria. Lotes por id (keyset) para nao segurar todas
// as fotos na memoria; foto que nao e imagem legivel fica sem miniatura e e
// so contada (o log nunca traz a foto).
@Component
public class FotoMiniaturaBackfill {

    private static final Logger log = LoggerFactory.getLogger(FotoMiniaturaBackfill.class);
    private static final int LOTE = 50;

    private final JdbcTemplate jdbcTemplate;
    private final MiniaturaFoto miniaturaFoto;

    public FotoMiniaturaBackfill(JdbcTemplate jdbcTemplate, MiniaturaFoto miniaturaFoto) {
        this.jdbcTemplate = jdbcTemplate;
        this.miniaturaFoto = miniaturaFoto;
    }

    @Async
    @EventListener(ApplicationReadyEvent.class)
    public void aoSubir() {
        executar();
    }

    // Sincrono; os testes chamam direto.
    public Resultado executar() {
        UUID ultimoId = new UUID(0L, 0L);
        int geradas = 0;
        int semMiniatura = 0;
        while (true) {
            List<Map<String, Object>> lote = jdbcTemplate.queryForList(
                    "SELECT id, foto_url FROM animal WHERE foto_url IS NOT NULL AND foto_miniatura IS NULL AND id > ?"
                            + " ORDER BY id LIMIT ?", ultimoId, LOTE);
            if (lote.isEmpty()) {
                break;
            }
            for (Map<String, Object> linha : lote) {
                ultimoId = (UUID) linha.get("id");
                String miniatura = miniaturaFoto.gerar((String) linha.get("foto_url"));
                if (miniatura == null) {
                    semMiniatura++;
                    continue;
                }
                geradas += jdbcTemplate.update(
                        "UPDATE animal SET foto_miniatura = ? WHERE id = ? AND foto_miniatura IS NULL", miniatura, ultimoId);
            }
        }
        log.info("Fotos de animais: backfill de miniaturas concluido ({} geradas, {} sem miniatura)", geradas, semMiniatura);
        return new Resultado(geradas, semMiniatura);
    }

    public record Resultado(int geradas, int semMiniatura) {
    }
}
