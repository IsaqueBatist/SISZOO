package com.siszoo.comum.exception;

import java.sql.SQLException;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.hibernate.exception.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import com.siszoo.animais.clinico.exception.RegistroJaRetificadoException;
import com.siszoo.animais.exception.MicrochipJaCadastradoException;
import com.siszoo.comum.dto.ErroResponse;
import com.siszoo.processos.exception.ResultadoJaRegistradoException;
import com.siszoo.usuarios.exception.FalhaAuditoriaException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private static final Set<String> CONSTRAINTS_RETIFICACAO_UNICA = Set.of(
            "uq_vacinacao_retifica_id", "uq_procedimento_retifica_id", "uq_prescricao_retifica_id",
            "uq_resultado_processo_retifica_id");

    @ExceptionHandler(FalhaAuditoriaException.class)
    public ResponseEntity<ErroResponse> handleFalhaAuditoria(FalhaAuditoriaException ex) {
        log.error("Evento de auditoria obrigatorio nao foi gravado", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErroResponse("Não foi possível concluir a operação. Tente novamente em instantes."));
    }

    @ExceptionHandler(ErroNegocioException.class)
    public ResponseEntity<ErroResponse> handleErroNegocio(ErroNegocioException ex) {
        return ResponseEntity.status(ex.getStatus()).body(new ErroResponse(ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErroResponse> handleValidacao(MethodArgumentNotValidException ex) {
        List<ErroResponse.CampoInvalido> campos = ex.getBindingResult().getFieldErrors().stream()
                .map(erro -> new ErroResponse.CampoInvalido(erro.getField(), erro.getDefaultMessage()))
                .sorted(Comparator.comparing(ErroResponse.CampoInvalido::campo))
                .toList();
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("Não foi possível salvar. Verifique os campos destacados e tente novamente.", campos));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErroResponse> handleViolacaoIntegridade(DataIntegrityViolationException ex) {
        String constraint = nomeDaConstraint(ex);
        log.warn("Violacao de integridade de dados barrada pelo banco (constraint={}, sqlState={})",
                constraint, sqlStateDe(ex));
        log.debug("Detalhe da violacao de integridade (pode conter valores da linha)", ex);
        if (constraint != null && CONSTRAINTS_RETIFICACAO_UNICA.contains(constraint)) {
            return handleErroNegocio(new RegistroJaRetificadoException());
        }
        if ("uq_resultado_processo_original".equals(constraint)) {
            return handleErroNegocio(new ResultadoJaRegistradoException());
        }
        if ("uq_animal_microchip".equals(constraint)) {
            return handleErroNegocio(new MicrochipJaCadastradoException());
        }
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErroResponse("Não foi possível salvar, porque os dados entram em conflito com um registro existente. Verifique as informações e tente novamente."));
    }

    private static String nomeDaConstraint(Throwable ex) {
        for (Throwable causa = ex; causa != null; causa = causa.getCause()) {
            if (causa instanceof ConstraintViolationException violacao && violacao.getConstraintName() != null) {
                return violacao.getConstraintName().toLowerCase(Locale.ROOT);
            }
        }
        return null;
    }

    private static String sqlStateDe(Throwable ex) {
        for (Throwable causa = ex; causa != null; causa = causa.getCause()) {
            if (causa instanceof SQLException sql && sql.getSQLState() != null) {
                return sql.getSQLState();
            }
        }
        return null;
    }

    @ExceptionHandler(CampoInvalidoException.class)
    public ResponseEntity<ErroResponse> handleCampoInvalido(CampoInvalidoException ex) {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse(ex.getMessage(),
                        List.of(new ErroResponse.CampoInvalido(ex.getCampo(), ex.getMessage()))));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErroResponse> handleMaxUploadSizeExceeded() {
        return ResponseEntity.status(HttpStatus.CONTENT_TOO_LARGE)
                .body(new ErroResponse("O arquivo passa do limite de 5 MB. Escolha um arquivo menor."));
    }
}
