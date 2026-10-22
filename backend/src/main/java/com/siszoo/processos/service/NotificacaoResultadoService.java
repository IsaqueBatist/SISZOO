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
import com.siszoo.processos.repository.ProcessoSanitarioRepository;
import com.siszoo.processos.repository.ResponsavelProcessoRepository;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

/**
 * Notificacao de resultado positivo (regra 19, DER; T34-4). Chamado so
 * pelo {@code NotificacaoResultadoListener}, depois do commit da escrita —
 * nunca na transacao que grava o resultado (ela nao pode ficar presa
 * esperando SMTP).
 *
 * <p>Municipe: tentativa real pelo {@link EmailService} (T35), com o template
 * {@value #TEMPLATE_EMAIL} em HTML e texto puro; melhor esforco — o envio e
 * assincrono e uma falha so e logada, nunca propaga (docs/decisoes/T37.md,
 * DH-24). Quando o SMTP aceita, grava a data/hora do envio no processo (#37,
 * T35-16); sem reenvio, porque o positivo e definitivo (T35-15). Vigilancia
 * Epidemiologica de Itu: nao existe endereco real configurado, entao fica
 * mockada (so loga a intencao).
 */
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
            // A escrita ja comitou antes do evento ser publicado; so chegaria
            // aqui numa exclusao concorrente, que o modulo nao tem hoje.
            log.warn("Processo {} nao encontrado ao notificar resultado", processoId);
            return;
        }
        ResponsavelProcesso responsavel = responsavelRepository.findByProcessoId(processoId).orElse(null);
        enviarAoMunicipe(responsavel, processo);
        notificarVigilanciaEpidemiologica(processo);
    }

    private void enviarAoMunicipe(ResponsavelProcesso responsavel, ProcessoSanitario processo) {
        if (responsavel == null || responsavel.getEmail() == null || responsavel.getEmail().isBlank()) {
            log.info("Processo {} sem e-mail do responsavel cadastrado — notificacao ao municipe nao enviada",
                    processo.getProtocolo());
            return;
        }
        // HashMap: o nome do responsavel pode vir nulo, e Map.of recusa nulos.
        Map<String, Object> variaveis = new HashMap<>();
        variaveis.put("nome", responsavel.getNome());
        variaveis.put("protocolo", processo.getProtocolo());
        UUID processoId = processo.getId();
        String protocolo = processo.getProtocolo();
        CompletableFuture<Void> envio;
        try {
            envio = emailService.enviar(
                    responsavel.getEmail(),
                    "SISZOO — Resultado do processo sanitario " + protocolo,
                    emailTemplateService.renderizarHtml(TEMPLATE_EMAIL, variaveis),
                    emailTemplateService.renderizarTexto(TEMPLATE_EMAIL, variaveis));
        } catch (TaskRejectedException ex) {
            // T35-17: a recusa do executor (ex.: aplicacao encerrando) sobe na
            // propria chamada, nao no future. Nada foi enviado nem registrado.
            log.warn("Notificacao ao municipe do processo {} nao submetida: executor recusou a tarefa", protocolo);
            log.debug("Detalhes da recusa da notificacao do processo {}", protocolo, ex);
            return;
        }
        // Falha de envio ja foi logada pelo EmailService (DH-24) e deixa a data
        // nula; so o aceite do SMTP grava (T35-16). O resultado ja foi salvo.
        envio.whenComplete((ok, falha) -> {
            if (falha == null) {
                registrarEnvio(processoId, protocolo);
            }
        });
    }

    // Dentro do callback, uma excecao sumiria no future: e logada aqui, so com
    // o protocolo. E-mail aceito sem data gravada = caso ambiguo (T35-16).
    private void registrarEnvio(UUID processoId, String protocolo) {
        // Microssegundos: a precisao do timestamp do PostgreSQL. Sem truncar,
        // o banco arredonda e a coluna diverge da data no evento de auditoria.
        LocalDateTime aceitoEm = LocalDateTime.now(clock).truncatedTo(ChronoUnit.MICROS);
        try {
            processoSanitarioService.registrarNotificacaoMunicipe(processoId, aceitoEm);
        } catch (RuntimeException ex) {
            log.warn("E-mail ao municipe do processo {} aceito pelo SMTP, mas a data do envio nao foi gravada: {}",
                    protocolo, ex.getClass().getSimpleName());
            log.debug("Detalhes da falha ao gravar o envio da notificacao do processo {}", protocolo, ex);
        }
    }

    // Mock: nao ha endereco real configurado para a Vigilancia Epidemiologica
    // de Itu (docs/decisoes/T37.md). So registra a intencao no log.
    private void notificarVigilanciaEpidemiologica(ProcessoSanitario processo) {
        log.info("[MOCK] notificacao a Vigilancia Epidemiologica de Itu seria enviada para o processo {}",
                processo.getProtocolo());
    }
}
