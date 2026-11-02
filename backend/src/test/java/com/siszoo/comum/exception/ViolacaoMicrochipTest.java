package com.siszoo.comum.exception;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.equalTo;

import java.sql.SQLException;

import org.hibernate.exception.ConstraintViolationException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.siszoo.comum.dto.ErroResponse;

// Duas criacoes simultaneas passam juntas pela pre-checagem do service e a
// segunda esbarra no indice. A resposta e a mesma da pre-checagem.
class ViolacaoMicrochipTest {

    @Test
    @DisplayName("indice unico de microchip responde como o microchip ja cadastrado")
    void microchipConcorrente() {
        var causa = new ConstraintViolationException("unico", new SQLException("x", "23505"), "uq_animal_microchip");

        ResponseEntity<ErroResponse> resposta = new GlobalExceptionHandler()
                .handleViolacaoIntegridade(new DataIntegrityViolationException("x", causa));

        assertThat(resposta.getStatusCode(), equalTo(HttpStatus.CONFLICT));
        assertThat(resposta.getBody().mensagem(), equalTo("Este microchip já está cadastrado em outro animal."));
    }
}
