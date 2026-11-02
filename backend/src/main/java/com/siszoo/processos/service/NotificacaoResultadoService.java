package com.siszoo.processos.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.task.TaskRejectedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.siszoo.comum.service.EmailService;
import com.siszoo.comum.service.EmailTemplateService;
import com.siszoo.processos.entity.ProcessoSanitario;
import com.siszoo.processos.entity.ResponsavelProcesso;
import com.siszoo.processos.exception.NotificacaoJaConfirmadaException;
import com.siszoo.processos.exception.ProcessoNaoEncontradoException;
import com.siszoo.processos.exception.ReenvioNotificacaoNaoPermitidoException;
import com.siszoo.processos.repository.ProcessoSanitarioRepository;
import com.siszoo.processos.repository.ResponsavelProcessoRepository;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;
import java.util.Locale;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Service
public class NotificacaoResultadoService {

    static final String TEMPLATE_EMAIL = "email/resultado-processo";

    private static final Logger log = LoggerFactory.getLogger(NotificacaoResultadoService.class);

    private final ProcessoSanitarioRepository processoRepository;
    private final ResponsavelProcessoRepository responsavelRepository;
    private final EmailService emailService;
    private final EmailTemplateService emailTemplateService;
    private final ProcessoSanitarioService processoSanitarioService;
    private final Clock clock;

    public NotificacaoResultadoService(
            ProcessoSanitarioRepository processoRepository,
            ResponsavelProcessoRepository responsavelRepository,
            EmailService emailService,
            EmailTemplateService emailTemplateService,
            ProcessoSanitarioService processoSanitarioService,
            Clock clock) {
        this.processoRepository = processoRepository;
        this.responsavelRepository = responsavelRepository;
        this.emailService = emailService;
        this.emailTemplateService = emailTemplateService;
        this.processoSanitarioService = processoSanitarioService;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public void notificarResultado(UUID processoId) {
        ProcessoSanitario processo = processoRepository.findById(processoId).orElse(null);
        if (processo == null) {
            log.warn("Processo {} nao encontrado ao notificar resultado", processoId);
            return;
        }
        ResponsavelProcesso responsavel = responsavelRepository.findByProcessoId(processoId).orElse(null);
        enviarAoMunicipe(responsavel, processo);
        notificarVigilanciaEpidemiologica(processo);
    }

    @Transactional(readOnly = true)
    public void reenviarNotificacaoMunicipe(UUID processoId) {
        ProcessoSanitario processo = processoRepository.findById(processoId)
                .orElseThrow(ProcessoNaoEncontradoException::new);
        if (processo.getResultadoLaboratorial() == null
                || !ResultadosNotificaveis.notifica(processo.getResultadoLaboratorial().getCodigo())) {
            throw new ReenvioNotificacaoNaoPermitidoException();
        }
        if (processo.getDataNotificacaoMunicipe() != null) {
            throw new NotificacaoJaConfirmadaException();
        }
        ResponsavelProcesso responsavel = responsavelRepository.findByProcessoId(processoId).orElse(null);
        enviarAoMunicipe(responsavel, processo);
    }

    private void enviarAoMunicipe(ResponsavelProcesso responsavel, ProcessoSanitario processo) {
        if (responsavel == null || responsavel.getEmail() == null || responsavel.getEmail().isBlank()) {
            log.info("Processo {} sem e-mail do responsavel cadastrado — notificacao ao municipe nao enviada",
                    processo.getProtocolo());
            return;
        }
        Map<String, Object> variaveis = new HashMap<>();
        variaveis.put("nome", responsavel.getNome());
        variaveis.put("protocolo", processo.getProtocolo());
        variaveis.put("resultado", descricaoResultado(processo));
        UUID processoId = processo.getId();
        String protocolo = processo.getProtocolo();
        CompletableFuture<Void> envio;
        try {
            envio = emailService.enviar(
                    responsavel.getEmail(),
                    "SISZOO — Resultado do processo sanitário " + protocolo,
                    emailTemplateService.renderizarHtml(TEMPLATE_EMAIL, variaveis),
                    emailTemplateService.renderizarTexto(TEMPLATE_EMAIL, variaveis));
        } catch (TaskRejectedException ex) {
            log.warn("Notificacao ao municipe do processo {} nao submetida: executor recusou a tarefa", protocolo);
            log.debug("Detalhes da recusa da notificacao do processo {}", protocolo, ex);
            return;
        }
        envio.whenComplete((ok, falha) -> {
            if (falha == null) {
                registrarEnvio(processoId, protocolo);
            }
        });
    }

    private void registrarEnvio(UUID processoId, String protocolo) {
        LocalDateTime aceitoEm = LocalDateTime.now(clock).truncatedTo(ChronoUnit.MICROS);
        try {
            processoSanitarioService.registrarNotificacaoMunicipe(processoId, aceitoEm);
        } catch (RuntimeException ex) {
            log.warn("E-mail ao municipe do processo {} aceito pelo SMTP, mas a data do envio nao foi gravada: {}",
                    protocolo, ex.getClass().getSimpleName());
            log.debug("Detalhes da falha ao gravar o envio da notificacao do processo {}", protocolo, ex);
        }
    }

    private static String descricaoResultado(ProcessoSanitario processo) {
        if (processo.getResultadoLaboratorial() == null || processo.getResultadoLaboratorial().getNome() == null) {
            return "registrado";
        }
        return processo.getResultadoLaboratorial().getNome().toLowerCase(Locale.ROOT);
    }

    private void notificarVigilanciaEpidemiologica(ProcessoSanitario processo) {
        log.info("[MOCK] notificacao a Vigilancia Epidemiologica de Itu seria enviada para o processo {}",
                processo.getProtocolo());
    }
}
