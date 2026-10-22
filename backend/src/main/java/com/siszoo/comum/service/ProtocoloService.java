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
//
// RELATORIO (T41, V20) reaproveita a mesma sequencia para o doc_id
// ("DOC-AAAA-NNNN") do relatorio_gerado — mesmo mecanismo de lock, formato de
// string diferente. proximoNumero expoe so o inteiro para quem formata
// diferente de proximo().
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

    // MANDATORY: so faz sentido dentro da transacao que grava o registro; fora
    // dela o numero seria consumido sem dono.
    @Transactional(propagation = Propagation.MANDATORY)
    public String proximo(Entidade entidade) {
        int numero = proximoNumero(entidade);
        return String.format("%03d/%d", numero, Year.now(clock).getValue());
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public int proximoNumero(Entidade entidade) {
        // Ano do registro (Clock do projeto), nao o da data de abertura informada (D21).
        int ano = Year.now(clock).getValue();
        return jdbcTemplate.queryForObject("""
                INSERT INTO protocolo_sequencia AS s (entidade, ano, ultimo) VALUES (?, ?, 1)
                ON CONFLICT (entidade, ano) DO UPDATE SET ultimo = s.ultimo + 1
                RETURNING ultimo
                """, Integer.class, entidade.name(), ano);
    }
}
