package com.siszoo.comum.service;

import java.time.Clock;
import java.time.Year;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProtocoloService {

    public enum Entidade {
        OCORRENCIA,
        PROCESSO,
        RELATORIO
    }

    private final JdbcTemplate jdbcTemplate;
    private final Clock clock;

    public ProtocoloService(JdbcTemplate jdbcTemplate, Clock clock) {
        this.jdbcTemplate = jdbcTemplate;
        this.clock = clock;
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public String proximo(Entidade entidade) {
        int numero = proximoNumero(entidade);
        return String.format("%03d/%d", numero, Year.now(clock).getValue());
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public int proximoNumero(Entidade entidade) {
        int ano = Year.now(clock).getValue();
        return jdbcTemplate.queryForObject("""
                INSERT INTO protocolo_sequencia AS s (entidade, ano, ultimo) VALUES (?, ?, 1)
                ON CONFLICT (entidade, ano) DO UPDATE SET ultimo = s.ultimo + 1
                RETURNING ultimo
                """, Integer.class, entidade.name(), ano);
    }
}
