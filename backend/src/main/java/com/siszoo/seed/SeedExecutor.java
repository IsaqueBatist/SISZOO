package com.siszoo.seed;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.function.Supplier;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;

class SeedExecutor {

    private static final Logger log = LoggerFactory.getLogger(SeedExecutor.class);

    private static final long CHAVE_TRAVA = 0x5EED2026L;

    private final JdbcTemplate jdbcTemplate;
    private final TransactionTemplate transacao;
    private final Validator validator;
    private final Map<String, int[]> contagem = new LinkedHashMap<>();

    SeedExecutor(JdbcTemplate jdbcTemplate, PlatformTransactionManager transactionManager, Validator validator) {
        this.jdbcTemplate = jdbcTemplate;
        this.transacao = new TransactionTemplate(transactionManager);
        this.validator = validator;
    }

    boolean tabelaDeControleExiste() {
        return jdbcTemplate.queryForObject("SELECT to_regclass('public.seed_controle') IS NOT NULL", Boolean.class);
    }

    void criarTabelaDeControle() {
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS seed_controle (
                    chave       text        PRIMARY KEY,
                    entidade    text        NOT NULL,
                    entidade_id uuid        NOT NULL,
                    criado_em   timestamptz NOT NULL DEFAULT now()
                )""");
    }

    long registrosNoControle() {
        return jdbcTemplate.queryForObject("SELECT count(*) FROM seed_controle", Long.class);
    }

    long contar(String sql, Object... parametros) {
        return jdbcTemplate.queryForObject(sql, Long.class, parametros);
    }

    Optional<UUID> idPorConsulta(String sql, Object... parametros) {
        return jdbcTemplate.queryForList(sql, UUID.class, parametros).stream().findFirst();
    }

    Optional<UUID> idDe(String chave) {
        List<UUID> ids = jdbcTemplate.queryForList(
                "SELECT entidade_id FROM seed_controle WHERE chave = ?", UUID.class, chave);
        return ids.stream().findFirst();
    }

    UUID idObrigatorio(String chave) {
        return idDe(chave).orElseThrow(() -> new IllegalStateException(
                "Seed: chave '" + chave + "' ainda nao foi criada (ordem das fases)."));
    }

    UUID garantir(String chave, String entidade, Supplier<UUID> criar) {
        return garantir(chave, entidade, Optional::empty, criar);
    }

    UUID garantir(String chave, String entidade, Supplier<Optional<UUID>> existente, Supplier<UUID> criar) {
        try {
            return transacao.execute(status -> {
                jdbcTemplate.queryForList("SELECT pg_advisory_xact_lock(?)", CHAVE_TRAVA);
                Optional<UUID> jaCriado = idDe(chave);
                if (jaCriado.isPresent()) {
                    contar(entidade, false);
                    return jaCriado.get();
                }
                Optional<UUID> adotado = existente.get();
                if (adotado.isPresent()) {
                    log.warn("Seed: '{}' ja existia sem linha em seed_controle; adotado pela chave natural.", chave);
                    registrar(chave, entidade, adotado.get());
                    contar(entidade, false);
                    return adotado.get();
                }
                UUID id = criar.get();
                registrar(chave, entidade, id);
                contar(entidade, true);
                return id;
            });
        } catch (RuntimeException e) {
            throw new IllegalStateException("Seed falhou em '" + chave + "': " + e.getMessage(), e);
        }
    }

    <T> T valido(T request) {
        Set<ConstraintViolation<T>> violacoes = validator.validate(request);
        if (!violacoes.isEmpty()) {
            String detalhes = violacoes.stream()
                    .map(v -> v.getPropertyPath() + " " + v.getMessage())
                    .sorted()
                    .collect(Collectors.joining("; "));
            throw new IllegalStateException(request.getClass().getSimpleName() + " invalido: " + detalhes);
        }
        return request;
    }

    void zerarContagem() {
        contagem.clear();
    }

    ResumoSeed resumo() {
        Map<String, ResumoSeed.Contagem> porEntidade = new LinkedHashMap<>();
        contagem.forEach((entidade, valores) -> porEntidade.put(entidade, new ResumoSeed.Contagem(valores[0], valores[1])));
        return new ResumoSeed(porEntidade);
    }

    private void registrar(String chave, String entidade, UUID id) {
        jdbcTemplate.update("INSERT INTO seed_controle (chave, entidade, entidade_id) VALUES (?, ?, ?)",
                chave, entidade, id);
    }

    private void contar(String entidade, boolean criado) {
        int[] valores = contagem.computeIfAbsent(entidade, e -> new int[2]);
        valores[criado ? 0 : 1]++;
    }
}
