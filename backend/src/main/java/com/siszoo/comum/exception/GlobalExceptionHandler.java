package com.siszoo.comum.exception;

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

import com.siszoo.animais.clinico.exception.CategoriaFarmacologicaInvalidaException;
import com.siszoo.animais.clinico.exception.DataAplicacaoFuturaException;
import com.siszoo.animais.clinico.exception.MedicamentoInvalidoException;
import com.siszoo.animais.clinico.exception.MedicamentoNaoEncontradoException;
import com.siszoo.animais.clinico.exception.PrescricaoNaoEncontradaException;
import com.siszoo.animais.clinico.exception.ProcedimentoNaoEncontradoException;
import com.siszoo.animais.clinico.exception.RegistroJaRetificadoException;
import com.siszoo.animais.clinico.exception.RetificacaoAnimalDivergenteException;
import com.siszoo.animais.clinico.exception.TipoProcedimentoInvalidoException;
import com.siszoo.animais.clinico.exception.VacinaInvalidaException;
import com.siszoo.animais.clinico.exception.VacinacaoNaoEncontradaException;
import com.siszoo.animais.exception.AnimalNaoEncontradoException;
import com.siszoo.animais.exception.BaiaInvalidaException;
import com.siszoo.animais.exception.BaiaNaoEncontradaException;
import com.siszoo.animais.exception.EspecieInvalidaException;
import com.siszoo.animais.exception.MicrochipImutavelException;
import com.siszoo.animais.exception.MicrochipJaCadastradoException;
import com.siszoo.animais.exception.MotivoEntradaInvalidoException;
import com.siszoo.animais.exception.StatusAnimalInvalidoException;
import com.siszoo.animais.exception.TipoBaiaInvalidoException;
import com.siszoo.comum.dto.ErroResponse;
import com.siszoo.usuarios.exception.CargoInvalidoException;
import com.siszoo.usuarios.exception.CredencialInvalidaException;
import com.siszoo.usuarios.exception.CrmvObrigatorioException;
import com.siszoo.usuarios.exception.EmailJaCadastradoException;
import com.siszoo.usuarios.exception.NotificacaoCriticaObrigatoriaException;
import com.siszoo.usuarios.exception.SenhasDivergentesException;
import com.siszoo.usuarios.exception.UsuarioNaoEncontradoException;
import com.siszoo.usuarios.exception.UsuarioNaoPodeDesativarASiMesmoException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private static final Set<String> CONSTRAINTS_RETIFICACAO_UNICA = Set.of(
            "uq_vacinacao_retifica_id", "uq_procedimento_retifica_id", "uq_prescricao_retifica_id");

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
    // excecao traz SQL, nomes de tabela/constraint e valores da linha, que
    // ficam so no log do servidor. Excecao: a unicidade de retifica_id so
    // dispara quando duas retificacoes do mesmo registro passam juntas pela
    // pre-checagem do service (RN-C02); a resposta e a mesma desse caminho.
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErroResponse> handleViolacaoIntegridade(DataIntegrityViolationException ex) {
        log.warn("Violacao de integridade de dados barrada pelo banco", ex);
        String constraint = nomeDaConstraint(ex);
        // Set.of rejeita contains(null): sem nome de constraint, segue o generico.
        if (constraint != null && CONSTRAINTS_RETIFICACAO_UNICA.contains(constraint)) {
            return handleRegistroJaRetificado();
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

    @ExceptionHandler(MicrochipJaCadastradoException.class)
    public ResponseEntity<ErroResponse> handleMicrochipJaCadastrado() {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErroResponse("Microchip ja cadastrado"));
    }

    @ExceptionHandler(MicrochipImutavelException.class)
    public ResponseEntity<ErroResponse> handleMicrochipImutavel() {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("Microchip nao pode ser alterado apos definido"));
    }

    @ExceptionHandler(AnimalNaoEncontradoException.class)
    public ResponseEntity<ErroResponse> handleAnimalNaoEncontrado() {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErroResponse("Animal nao encontrado"));
    }

    @ExceptionHandler(EspecieInvalidaException.class)
    public ResponseEntity<ErroResponse> handleEspecieInvalida() {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("Especie informada nao existe"));
    }

    @ExceptionHandler(StatusAnimalInvalidoException.class)
    public ResponseEntity<ErroResponse> handleStatusAnimalInvalido() {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("Status informado nao existe"));
    }

    @ExceptionHandler(MotivoEntradaInvalidoException.class)
    public ResponseEntity<ErroResponse> handleMotivoEntradaInvalido() {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("Motivo de entrada informado nao existe"));
    }

    @ExceptionHandler(BaiaInvalidaException.class)
    public ResponseEntity<ErroResponse> handleBaiaInvalida() {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("Baia informada nao existe"));
    }

    @ExceptionHandler(BaiaNaoEncontradaException.class)
    public ResponseEntity<ErroResponse> handleBaiaNaoEncontrada() {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErroResponse("Baia nao encontrada"));
    }

    @ExceptionHandler(TipoBaiaInvalidoException.class)
    public ResponseEntity<ErroResponse> handleTipoBaiaInvalido() {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("Tipo de baia informado nao existe"));
    }

    @ExceptionHandler(UsuarioNaoPodeDesativarASiMesmoException.class)
    public ResponseEntity<ErroResponse> handleUsuarioNaoPodeDesativarASiMesmo() {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("Nao e permitido desativar o proprio usuario"));
    }

    @ExceptionHandler(VacinacaoNaoEncontradaException.class)
    public ResponseEntity<ErroResponse> handleVacinacaoNaoEncontrada() {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErroResponse("Vacinacao nao encontrada"));
    }

    @ExceptionHandler(ProcedimentoNaoEncontradoException.class)
    public ResponseEntity<ErroResponse> handleProcedimentoNaoEncontrado() {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErroResponse("Procedimento nao encontrado"));
    }

    @ExceptionHandler(PrescricaoNaoEncontradaException.class)
    public ResponseEntity<ErroResponse> handlePrescricaoNaoEncontrada() {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErroResponse("Prescricao nao encontrada"));
    }

    @ExceptionHandler(VacinaInvalidaException.class)
    public ResponseEntity<ErroResponse> handleVacinaInvalida() {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("Vacina informada nao existe"));
    }

    @ExceptionHandler(TipoProcedimentoInvalidoException.class)
    public ResponseEntity<ErroResponse> handleTipoProcedimentoInvalido() {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("Tipo de procedimento informado nao existe"));
    }

    @ExceptionHandler(MedicamentoInvalidoException.class)
    public ResponseEntity<ErroResponse> handleMedicamentoInvalido() {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("Medicamento informado nao existe"));
    }

    @ExceptionHandler(RetificacaoAnimalDivergenteException.class)
    public ResponseEntity<ErroResponse> handleRetificacaoAnimalDivergente() {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("Registro retificado pertence a outro animal"));
    }

    @ExceptionHandler(DataAplicacaoFuturaException.class)
    public ResponseEntity<ErroResponse> handleDataAplicacaoFutura() {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("Data de aplicacao nao pode ser futura"));
    }

    @ExceptionHandler(RegistroJaRetificadoException.class)
    public ResponseEntity<ErroResponse> handleRegistroJaRetificado() {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErroResponse("Registro ja foi retificado por outro"));
    }

    @ExceptionHandler(MedicamentoNaoEncontradoException.class)
    public ResponseEntity<ErroResponse> handleMedicamentoNaoEncontrado() {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErroResponse("Medicamento nao encontrado"));
    }

    @ExceptionHandler(CategoriaFarmacologicaInvalidaException.class)
    public ResponseEntity<ErroResponse> handleCategoriaFarmacologicaInvalida() {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("Categoria farmacologica informada nao existe"));
    }
}
