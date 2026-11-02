package com.siszoo.comum.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ScaffoldViolacaoIntegridadeController {

    private final JdbcTemplate jdbcTemplate;

    public ScaffoldViolacaoIntegridadeController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostMapping("/api/teste/integridade/violacao")
    public ResponseEntity<Void> violarConstraintUnica() {
        jdbcTemplate.update("INSERT INTO status_animal (codigo, nome) VALUES ('adotado', 'Duplicado')");
        return ResponseEntity.ok().build();
    }
}
