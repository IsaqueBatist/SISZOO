package com.siszoo.comum.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.siszoo.comum.dto.ErroResponse;
import com.siszoo.usuarios.exception.CargoInvalidoException;
import com.siszoo.usuarios.exception.CredencialInvalidaException;
import com.siszoo.usuarios.exception.CrmvObrigatorioException;
import com.siszoo.usuarios.exception.EmailJaCadastradoException;
import com.siszoo.usuarios.exception.NotificacaoCriticaObrigatoriaException;
import com.siszoo.usuarios.exception.SenhasDivergentesException;
import com.siszoo.usuarios.exception.UsuarioNaoEncontradoException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(CredencialInvalidaException.class)
    public ResponseEntity<ErroResponse> handleCredencialInvalida() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ErroResponse("Credenciais invalidas"));
    }

    @ExceptionHandler(SenhasDivergentesException.class)
    public ResponseEntity<ErroResponse> handleSenhasDivergentes() {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("Nova senha e confirmacao nao conferem"));
    }

    @ExceptionHandler(EmailJaCadastradoException.class)
    public ResponseEntity<ErroResponse> handleEmailJaCadastrado() {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErroResponse("E-mail ja cadastrado"));
    }

    @ExceptionHandler(CrmvObrigatorioException.class)
    public ResponseEntity<ErroResponse> handleCrmvObrigatorio() {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("CRMV e obrigatorio para o cargo Veterinario"));
    }

    @ExceptionHandler(CargoInvalidoException.class)
    public ResponseEntity<ErroResponse> handleCargoInvalido() {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("Cargo informado nao existe"));
    }

    @ExceptionHandler(UsuarioNaoEncontradoException.class)
    public ResponseEntity<ErroResponse> handleUsuarioNaoEncontrado() {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErroResponse("Usuario nao encontrado"));
    }

    @ExceptionHandler(NotificacaoCriticaObrigatoriaException.class)
    public ResponseEntity<ErroResponse> handleNotificacaoCriticaObrigatoria() {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("Notificacao de alertas criticos nao pode ser desativada"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErroResponse> handleValidacao() {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("Dados invalidos"));
    }
}
