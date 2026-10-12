package com.siszoo.comum.service;

import java.time.Clock;
import java.time.Year;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

// Protocolo NNN/AAAA gerado no servidor (DER §3.4/§3.5, D13): uma sequencia
// por entidade e por ano (tabela protocolo_sequencia, V10). O upsert com
// RETURNING trava a linha (entidade, ano) ate o fim da transacao de quem
// chama — duas criacoes concorrentes nunca recebem o mesmo numero, e um
// rollback desfaz tambem o incremento. Acima de 999 o numero cresce
// ("1000/2026"): o formato tem no minimo 3 digitos, sem teto.
@Service
public class ProtocoloService {

    public enum Entidade {
        OCORRENCIA,
        PROCESSO
    }

    private final JdbcTemplate jdbcTemplate;
    private final Clock clock;

    public ProtocoloService(JdbcTemplate jdbcTemplate, Clock clock) {
        this.jdbcTemplate = jdbcTemplate;
        this.clock = clock;
    }

    // MANDATORY: so faz sentido dentro da transacao que grava o registro; fora
    // dela o numero seria consumido sem dono.
    @Transactional(propagation = Propagation.MANDATORY)
    public String proximo(Entidade entidade) {
        // Ano do registro (Clock do projeto), nao o da data de abertura informada (D21).
        int ano = Year.now(clock).getValue();
        Integer numero = jdbcTemplate.queryForObject("""
                INSERT INTO protocolo_sequencia AS s (entidade, ano, ultimo) VALUES (?, ?, 1)
                ON CONFLICT (entidade, ano) DO UPDATE SET ultimo = s.ultimo + 1
                RETURNING ultimo
                """, Integer.class, entidade.name(), ano);
        return String.format("%03d/%d", numero, ano);
    }
}
