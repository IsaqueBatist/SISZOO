package com.siszoo.comum.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

// SCAFFOLD T24: existe so em src/test. Provoca uma violacao REAL de
// constraint no banco (UNIQUE uq_status_animal_codigo, V4) de forma
// deterministica, para provar por HTTP o tratamento de
// DataIntegrityViolationException em GlobalExceptionHandler. Os caminhos de
// producao validam antes de gravar; o unico que chega ao banco sem validacao
// previa depende de corrida entre duas retificacoes simultaneas (instavel
// para teste).
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
