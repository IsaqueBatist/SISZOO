package com.siszoo.comum.exception;

import java.sql.SQLException;

import org.hibernate.exception.ConstraintViolationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import com.siszoo.animais.exception.BaiaIndisponivelException;
import com.siszoo.usuarios.exception.FalhaAuditoriaException;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

@RestController
@RequestMapping("/api/teste/excecoes")
public class ScaffoldExcecoesController {

    public record CorpoValidado(@NotBlank String primeiro, @NotBlank String segundo) {
    }

    @PostMapping("/dominio")
    public void dominio(@RequestParam String classe) throws ReflectiveOperationException {
        throw (RuntimeException) Class.forName(classe).getDeclaredConstructor().newInstance();
    }

    @PostMapping("/campo-invalido")
    public void campoInvalido() {
        throw new CampoInvalidoException("campoDeTeste", "Mensagem do campo de teste");
    }

    @PostMapping("/baia-inativa")
    public void baiaInativa() {
        throw BaiaIndisponivelException.inativa();
    }

    @PostMapping("/baia-superlotada")
    public void baiaSuperlotada() {
        throw BaiaIndisponivelException.superlotada();
    }

    @PostMapping("/falha-auditoria")
    public void falhaAuditoria() {
        throw new FalhaAuditoriaException(new IllegalStateException("causa interna: INSERT INTO auditoria_evento ..."));
    }

    @PostMapping("/integridade/{constraint}")
    public void integridade(@PathVariable String constraint) {
        SQLException sql = new SQLException("Key (cpf)=(123.456.789-00) already exists", "23505");
        throw new DataIntegrityViolationException("could not execute statement",
                new ConstraintViolationException("could not execute statement", sql, constraint));
    }

    @PostMapping("/integridade-sem-constraint")
    public void integridadeSemConstraint() {
        throw new DataIntegrityViolationException("violacao sem causa");
    }

    @PostMapping("/chave-duplicada")
    public void chaveDuplicada() {
        throw new DuplicateKeyException("duplicate key", new SQLException("Failing row contains (x)", "23505"));
    }

    @PostMapping("/validacao")
    public void validacao(@Valid @RequestBody CorpoValidado corpo) {
    }

    @PostMapping("/upload-grande")
    public void uploadGrande() {
        throw new MaxUploadSizeExceededException(5 * 1024 * 1024);
    }

    @PostMapping("/acesso-negado")
    public void acessoNegado() {
        throw new AccessDeniedException("negado no teste");
    }

    @PostMapping("/inesperada")
    public void inesperada() {
        throw new IllegalStateException("erro inesperado de teste");
    }
}
