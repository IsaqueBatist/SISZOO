package com.siszoo.comum.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.siszoo.comum.dto.ErroResponse;
import com.siszoo.usuarios.exception.CredencialInvalidaException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(CredencialInvalidaException.class)
    public ResponseEntity<ErroResponse> handleCredencialInvalida() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ErroResponse("Credenciais invalidas"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErroResponse> handleValidacao() {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("Dados invalidos"));
    }
}
