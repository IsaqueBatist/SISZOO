package com.siszoo.processos.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.siszoo.comum.service.EmailService;
import com.siszoo.comum.service.EmailTemplateService;
import com.siszoo.processos.entity.ProcessoSanitario;
import com.siszoo.processos.entity.ResponsavelProcesso;
import com.siszoo.processos.repository.ProcessoSanitarioRepository;
import com.siszoo.processos.repository.ResponsavelProcessoRepository;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Notificacao de resultado positivo (regra 19, DER; T34-4). Chamado so
 * pelo {@code NotificacaoResultadoListener}, depois do commit da escrita —
 * nunca na transacao que grava o resultado (ela nao pode ficar presa
 * esperando SMTP).
 *
 * <p>Municipe: tentativa real pelo {@link EmailService} (T35), com o template
 * {@value #TEMPLATE_EMAIL} em HTML e texto puro; melhor esforco — o envio e
 * assincrono e uma falha so e logada pelo EmailService, nunca propaga
 * (docs/decisoes/T37.md, DH-24). Vigilancia Epidemiologica de Itu: nao existe
 * endereco real configurado, entao fica mockada (so loga a intencao).
 */
@Service
public class NotificacaoResultadoService {

    static final String TEMPLATE_EMAIL = "email/resultado-processo";

    private static final Logger log = LoggerFactory.getLogger(NotificacaoResultadoService.class);

    private final ProcessoSanitarioRepository processoRepository;
    private final ResponsavelProcessoRepository responsavelRepository;
    private final EmailService emailService;
    private final EmailTemplateService emailTemplateService;

    public NotificacaoResultadoService(
            ProcessoSanitarioRepository processoRepository,
            ResponsavelProcessoRepository responsavelRepository,
            EmailService emailService,
            EmailTemplateService emailTemplateService) {
        this.processoRepository = processoRepository;
        this.responsavelRepository = responsavelRepository;
        this.emailService = emailService;
        this.emailTemplateService = emailTemplateService;
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
        // O future e ignorado de proposito: o EmailService ja loga a falha, e o
        // resultado foi salvo antes deste listener rodar (DH-24).
        emailService.enviar(
                responsavel.getEmail(),
                "SISZOO — Resultado do processo sanitario " + processo.getProtocolo(),
                emailTemplateService.renderizarHtml(TEMPLATE_EMAIL, variaveis),
                emailTemplateService.renderizarTexto(TEMPLATE_EMAIL, variaveis));
    }

    // Mock: nao ha endereco real configurado para a Vigilancia Epidemiologica
    // de Itu (docs/decisoes/T37.md). So registra a intencao no log.
    private void notificarVigilanciaEpidemiologica(ProcessoSanitario processo) {
        log.info("[MOCK] notificacao a Vigilancia Epidemiologica de Itu seria enviada para o processo {}",
                processo.getProtocolo());
    }
}
