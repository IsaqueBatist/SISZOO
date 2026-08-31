package com.siszoo.comum.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.siszoo.animais.clinico.exception.CategoriaFarmacologicaInvalidaException;
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
