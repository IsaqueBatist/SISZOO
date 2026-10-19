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
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import com.siszoo.animais.clinico.exception.CategoriaFarmacologicaInvalidaException;
import com.siszoo.animais.clinico.exception.CategoriaFarmacologicaJaCadastradaException;
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
import com.siszoo.animais.exception.BaiaIndisponivelException;
import com.siszoo.animais.exception.BaiaInvalidaException;
import com.siszoo.animais.exception.BaiaNaoEncontradaException;
import com.siszoo.animais.exception.EspecieInvalidaException;
import com.siszoo.animais.exception.MicrochipImutavelException;
import com.siszoo.animais.exception.MicrochipJaCadastradoException;
import com.siszoo.animais.exception.MotivoEntradaInvalidoException;
import com.siszoo.animais.exception.StatusAnimalInvalidoException;
import com.siszoo.animais.exception.TipoBaiaInvalidoException;
import com.siszoo.comum.dto.ErroResponse;
import com.siszoo.ocorrencias.exception.AnexoInvalidoException;
import com.siszoo.ocorrencias.exception.AnexoNaoEncontradoException;
import com.siszoo.ocorrencias.exception.AnonimaESigilosaException;
import com.siszoo.ocorrencias.exception.AnonimatoIrreversivelException;
import com.siszoo.ocorrencias.exception.DataAberturaFuturaException;
import com.siszoo.ocorrencias.exception.DenuncianteEmDenunciaAnonimaException;
import com.siszoo.ocorrencias.exception.DescricaoEncerramentoObrigatoriaException;
import com.siszoo.ocorrencias.exception.EncerramentoComProcessoPendenteException;
import com.siszoo.ocorrencias.exception.LimiteAnexosAtingidoException;
import com.siszoo.ocorrencias.exception.NomeDenuncianteObrigatorioException;
import com.siszoo.ocorrencias.exception.OcorrenciaEncerradaException;
import com.siszoo.ocorrencias.exception.OcorrenciaNaoEncontradaException;
import com.siszoo.ocorrencias.exception.ProvidenciaInvalidaException;
import com.siszoo.ocorrencias.exception.ProvidenciaObrigatoriaException;
import com.siszoo.ocorrencias.exception.TipoOcorrenciaInvalidoException;
import com.siszoo.ocorrencias.exception.TransicaoStatusInvalidaException;
import com.siszoo.ocorrencias.exception.UrgenciaDefinidaPeloProcessoException;
import com.siszoo.ocorrencias.exception.VinculoJaExistenteException;
import com.siszoo.processos.exception.ContatoHumanoInconsistenteException;
import com.siszoo.processos.exception.CorrecaoResultadoNaoPermitidaException;
import com.siszoo.processos.exception.DataColetaFuturaException;
import com.siszoo.processos.exception.DataResultadoAnteriorAberturaException;
import com.siszoo.processos.exception.DataResultadoFuturaException;
import com.siszoo.processos.exception.DesfechoInvalidoException;
import com.siszoo.processos.exception.DoencaInvalidaException;
import com.siszoo.processos.exception.IdentificacaoComAnimalDoCanilException;
import com.siszoo.processos.exception.IdentificacaoObrigatoriaException;
import com.siszoo.processos.exception.LaboratorioInvalidoException;
import com.siszoo.processos.exception.ProcessoNaoEncontradoException;
import com.siszoo.processos.exception.ResultadoInvalidoException;
import com.siszoo.processos.exception.ResultadoJaRegistradoException;
import com.siszoo.processos.exception.ResultadoObrigatorioException;
import com.siszoo.processos.exception.ResultadoRetificadoInvalidoException;
import com.siszoo.processos.exception.SintomaInvalidoException;
import com.siszoo.processos.exception.SintomaSemStatusSintomaticoException;
import com.siszoo.processos.exception.TransicaoStatusProcessoInvalidaException;
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
            "uq_vacinacao_retifica_id", "uq_procedimento_retifica_id", "uq_prescricao_retifica_id",
            "uq_resultado_processo_retifica_id");

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
    // O mesmo vale para o resultado original unico do processo (V14): a
    // resposta e a do segundo lancamento barrado pelo service.
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErroResponse> handleViolacaoIntegridade(DataIntegrityViolationException ex) {
        log.warn("Violacao de integridade de dados barrada pelo banco", ex);
        String constraint = nomeDaConstraint(ex);
        // Set.of rejeita contains(null): sem nome de constraint, segue o generico.
        if (constraint != null && CONSTRAINTS_RETIFICACAO_UNICA.contains(constraint)) {
            return handleRegistroJaRetificado();
        }
        if ("uq_resultado_processo_original".equals(constraint)) {
            return handleResultadoJaRegistrado();
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

    @ExceptionHandler(CampoInvalidoException.class)
    public ResponseEntity<ErroResponse> handleCampoInvalido(CampoInvalidoException ex) {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse(ex.getMessage(),
                        List.of(new ErroResponse.CampoInvalido(ex.getCampo(), ex.getMessage()))));
    }

    @ExceptionHandler(BaiaIndisponivelException.class)
    public ResponseEntity<ErroResponse> handleBaiaIndisponivel(BaiaIndisponivelException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErroResponse(ex.getMessage()));
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

    @ExceptionHandler(CategoriaFarmacologicaJaCadastradaException.class)
    public ResponseEntity<ErroResponse> handleCategoriaFarmacologicaJaCadastrada() {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErroResponse("Categoria farmacologica ja cadastrada"));
    }

    @ExceptionHandler(CategoriaFarmacologicaInvalidaException.class)
    public ResponseEntity<ErroResponse> handleCategoriaFarmacologicaInvalida() {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("Categoria farmacologica informada nao existe"));
    }

    @ExceptionHandler(OcorrenciaNaoEncontradaException.class)
    public ResponseEntity<ErroResponse> handleOcorrenciaNaoEncontrada() {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErroResponse("Ocorrencia nao encontrada"));
    }

    @ExceptionHandler(AnexoNaoEncontradoException.class)
    public ResponseEntity<ErroResponse> handleAnexoNaoEncontrado() {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErroResponse("Anexo nao encontrado"));
    }

    @ExceptionHandler(ProcessoNaoEncontradoException.class)
    public ResponseEntity<ErroResponse> handleProcessoNaoEncontrado() {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErroResponse("Processo sanitario nao encontrado"));
    }

    @ExceptionHandler(TipoOcorrenciaInvalidoException.class)
    public ResponseEntity<ErroResponse> handleTipoOcorrenciaInvalido() {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("Tipo de ocorrencia informado nao existe"));
    }

    @ExceptionHandler(ProvidenciaInvalidaException.class)
    public ResponseEntity<ErroResponse> handleProvidenciaInvalida() {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("Providencia informada nao existe"));
    }

    @ExceptionHandler(ProvidenciaObrigatoriaException.class)
    public ResponseEntity<ErroResponse> handleProvidenciaObrigatoria() {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("Providencia tomada e obrigatoria no encerramento"));
    }

    @ExceptionHandler(DescricaoEncerramentoObrigatoriaException.class)
    public ResponseEntity<ErroResponse> handleDescricaoEncerramentoObrigatoria() {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("Descricao do encerramento e obrigatoria quando a providencia e Outro"));
    }

    @ExceptionHandler(TransicaoStatusInvalidaException.class)
    public ResponseEntity<ErroResponse> handleTransicaoStatusInvalida() {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("Transicao de status nao permitida para a ocorrencia"));
    }

    @ExceptionHandler(TransicaoStatusProcessoInvalidaException.class)
    public ResponseEntity<ErroResponse> handleTransicaoStatusProcessoInvalida() {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("Transicao de status nao permitida para o processo"));
    }

    @ExceptionHandler(DoencaInvalidaException.class)
    public ResponseEntity<ErroResponse> handleDoencaInvalida() {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("Doenca invalida"));
    }

    @ExceptionHandler(LaboratorioInvalidoException.class)
    public ResponseEntity<ErroResponse> handleLaboratorioInvalido() {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("Laboratorio invalido"));
    }

    @ExceptionHandler(SintomaInvalidoException.class)
    public ResponseEntity<ErroResponse> handleSintomaInvalido() {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("Sintoma invalido"));
    }

    @ExceptionHandler(DataColetaFuturaException.class)
    public ResponseEntity<ErroResponse> handleDataColetaFutura() {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("Data de coleta nao pode ser futura"));
    }

    @ExceptionHandler(DataResultadoFuturaException.class)
    public ResponseEntity<ErroResponse> handleDataResultadoFutura() {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("Data do resultado nao pode ser futura"));
    }

    @ExceptionHandler(DataResultadoAnteriorAberturaException.class)
    public ResponseEntity<ErroResponse> handleDataResultadoAnteriorAbertura() {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("Data do resultado nao pode ser anterior a data de abertura do processo"));
    }

    @ExceptionHandler(ResultadoInvalidoException.class)
    public ResponseEntity<ErroResponse> handleResultadoInvalido() {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("Resultado laboratorial invalido: use positivo, negativo, inconclusivo, material_inadequado ou nao_realizado"));
    }

    @ExceptionHandler(ResultadoJaRegistradoException.class)
    public ResponseEntity<ErroResponse> handleResultadoJaRegistrado() {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErroResponse("Processo ja tem resultado registrado; para corrigir, informe retificaId do resultado vigente"));
    }

    @ExceptionHandler(ResultadoObrigatorioException.class)
    public ResponseEntity<ErroResponse> handleResultadoObrigatorio() {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("O status COM_RESULTADO so e alcancado pelo registro do resultado laboratorial"));
    }

    @ExceptionHandler(ResultadoRetificadoInvalidoException.class)
    public ResponseEntity<ErroResponse> handleResultadoRetificadoInvalido() {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("Resultado a corrigir nao existe neste processo"));
    }

    @ExceptionHandler(CorrecaoResultadoNaoPermitidaException.class)
    public ResponseEntity<ErroResponse> handleCorrecaoResultadoNaoPermitida() {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("Resultado so pode ser corrigido com o processo em COM_RESULTADO"));
    }

    @ExceptionHandler(IdentificacaoComAnimalDoCanilException.class)
    public ResponseEntity<ErroResponse> handleIdentificacaoComAnimalDoCanil() {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("Amostra de animal do canil nao aceita dados de identificacao: eles vem da ficha"));
    }

    @ExceptionHandler(IdentificacaoObrigatoriaException.class)
    public ResponseEntity<ErroResponse> handleIdentificacaoObrigatoria() {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("Amostra de animal de campo exige especie e sexo"));
    }

    @ExceptionHandler(ContatoHumanoInconsistenteException.class)
    public ResponseEntity<ErroResponse> handleContatoHumanoInconsistente() {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("Nivel de contato e agressao sao obrigatorios com contato humano e proibidos sem ele"));
    }

    @ExceptionHandler(SintomaSemStatusSintomaticoException.class)
    public ResponseEntity<ErroResponse> handleSintomaSemStatusSintomatico() {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("Sintomas so podem ser informados em amostra com status clinico sintomatico"));
    }

    @ExceptionHandler(OcorrenciaEncerradaException.class)
    public ResponseEntity<ErroResponse> handleOcorrenciaEncerrada() {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("Ocorrencia encerrada nao pode ser alterada"));
    }

    @ExceptionHandler(EncerramentoComProcessoPendenteException.class)
    public ResponseEntity<ErroResponse> handleEncerramentoComProcessoPendente() {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("Ocorrencia com processo sanitario vinculado nao concluido nao pode ser encerrada"));
    }

    @ExceptionHandler(NomeDenuncianteObrigatorioException.class)
    public ResponseEntity<ErroResponse> handleNomeDenuncianteObrigatorio() {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("Nome do denunciante e obrigatorio quando a denuncia nao e anonima nem sigilosa"));
    }

    @ExceptionHandler(DataAberturaFuturaException.class)
    public ResponseEntity<ErroResponse> handleDataAberturaFutura() {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("Data de abertura nao pode ser futura"));
    }

    @ExceptionHandler(DenuncianteEmDenunciaAnonimaException.class)
    public ResponseEntity<ErroResponse> handleDenuncianteEmDenunciaAnonima() {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("Denuncia anonima nao aceita dados do denunciante"));
    }

    @ExceptionHandler(AnonimaESigilosaException.class)
    public ResponseEntity<ErroResponse> handleAnonimaESigilosa() {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("Denuncia nao pode ser anonima e sigilosa ao mesmo tempo"));
    }

    @ExceptionHandler(AnonimatoIrreversivelException.class)
    public ResponseEntity<ErroResponse> handleAnonimatoIrreversivel() {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("Denuncia identificada nao pode passar a anonima"));
    }

    @ExceptionHandler(UrgenciaDefinidaPeloProcessoException.class)
    public ResponseEntity<ErroResponse> handleUrgenciaDefinidaPeloProcesso() {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("Urgencia definida pelo processo vinculado nao pode ser desmarcada"));
    }

    @ExceptionHandler(AnexoInvalidoException.class)
    public ResponseEntity<ErroResponse> handleAnexoInvalido() {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("Anexo deve ser JPG, PNG ou PDF com ate 5 MB"));
    }

    @ExceptionHandler(LimiteAnexosAtingidoException.class)
    public ResponseEntity<ErroResponse> handleLimiteAnexosAtingido() {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("Limite de 5 anexos por ocorrencia atingido"));
    }

    // Upload acima de spring.servlet.multipart.max-file-size (5 MB, anexos de
    // ocorrencia): o Spring recusa antes de chegar ao service.
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErroResponse> handleMaxUploadSizeExceeded() {
        return ResponseEntity.status(HttpStatus.CONTENT_TOO_LARGE)
                .body(new ErroResponse("Arquivo excede o tamanho maximo de 5 MB"));
    }

    @ExceptionHandler(VinculoJaExistenteException.class)
    public ResponseEntity<ErroResponse> handleVinculoJaExistente() {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErroResponse("Ocorrencia ou processo ja possui vinculo"));
    }

    @ExceptionHandler(DesfechoInvalidoException.class)
    public ResponseEntity<ErroResponse> handleDesfechoInvalido() {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(new ErroResponse("Desfecho do animal informado nao existe"));
    }
}
