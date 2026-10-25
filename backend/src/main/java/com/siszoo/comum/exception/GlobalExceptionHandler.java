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
import com.siszoo.comum.dto.ErroResponse;
import com.siszoo.processos.exception.ResultadoJaRegistradoException;
import com.siszoo.usuarios.exception.FalhaAuditoriaException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private static final Set<String> CONSTRAINTS_RETIFICACAO_UNICA = Set.of(
            "uq_vacinacao_retifica_id", "uq_procedimento_retifica_id", "uq_prescricao_retifica_id",
            "uq_resultado_processo_retifica_id");

    // T43: a causa (SQL do INSERT do evento, so ids) vai so para o log; o
    // cliente recebe mensagem generica, sem nenhum dado da requisicao.
    @ExceptionHandler(FalhaAuditoriaException.class)
    public ResponseEntity<ErroResponse> handleFalhaAuditoria(FalhaAuditoriaException ex) {
        log.error("Evento de auditoria obrigatorio nao foi gravado", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErroResponse("Nao foi possivel concluir a operacao"));
    }

    // Toda regra de negocio com status e mensagem fixos (T45, D1): cada
    // excecao declara os seus em ErroNegocioException. Os handlers que fazem
    // algo alem disso (log, `campos`, constraint do banco) continuam abaixo.
    @ExceptionHandler(ErroNegocioException.class)
    public ResponseEntity<ErroResponse> handleErroNegocio(ErroNegocioException ex) {
        return ResponseEntity.status(ex.getStatus()).body(new ErroResponse(ex.getMessage()));
    }

    // `campos` lista cada campo rejeitado (ordenado pelo nome, para o corpo ser
    // deterministico) — o cliente sabe o que corrigir sem depender do texto.
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErroResponse> handleValidacao(MethodArgumentNotValidException ex) {
        List<ErroResponse.CampoInvalido> campos = ex.getBindingResult().getFieldErrors().stream()
                .map(erro -> new ErroResponse.CampoInvalido(erro.getField(), erro.getDefaultMessage()))
                .sorted(Comparator.comparing(ErroResponse.CampoInvalido::campo))
                .toList();
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("Dados invalidos", campos));
    }

    // Ultima barreira: uma constraint do banco (NOT NULL, UNIQUE, FK, CHECK)
    // barrou a escrita. O corpo e generico de proposito — a mensagem da
    // excecao traz SQL, nomes de tabela/constraint e valores da linha. Por
    // isso o WARN leva so constraint e SQLState: o "Failing row contains (...)"
    // e o "Key (...)=(...)" do PostgreSQL podem trazer CPF, telefone, e-mail ou
    // hash de senha (LGPD), e ficam so no DEBUG. Excecao: a unicidade de
    // retifica_id so dispara quando duas retificacoes do mesmo registro passam
    // juntas pela pre-checagem do service (RN-C02); a resposta e a mesma desse
    // caminho. O mesmo vale para o resultado original unico do processo (V14):
    // a resposta e a do segundo lancamento barrado pelo service.
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErroResponse> handleViolacaoIntegridade(DataIntegrityViolationException ex) {
        String constraint = nomeDaConstraint(ex);
        log.warn("Violacao de integridade de dados barrada pelo banco (constraint={}, sqlState={})",
                constraint, sqlStateDe(ex));
        log.debug("Detalhe da violacao de integridade (pode conter valores da linha)", ex);
        // Set.of rejeita contains(null): sem nome de constraint, segue o generico.
        if (constraint != null && CONSTRAINTS_RETIFICACAO_UNICA.contains(constraint)) {
            return handleErroNegocio(new RegistroJaRetificadoException());
        }
        if ("uq_resultado_processo_original".equals(constraint)) {
            return handleErroNegocio(new ResultadoJaRegistradoException());
        }
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErroResponse("Operacao viola uma regra de integridade dos dados"));
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

    // Upload acima de spring.servlet.multipart.max-file-size (5 MB, anexos de
    // ocorrencia): o Spring recusa antes de chegar ao service.
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErroResponse> handleMaxUploadSizeExceeded() {
        return ResponseEntity.status(HttpStatus.CONTENT_TOO_LARGE)
                .body(new ErroResponse("Arquivo excede o tamanho maximo de 5 MB"));
    }
}
