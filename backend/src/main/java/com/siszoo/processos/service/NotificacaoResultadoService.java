package com.siszoo.processos.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.siszoo.processos.entity.ProcessoSanitario;
import com.siszoo.processos.entity.ResponsavelProcesso;
import com.siszoo.processos.repository.ProcessoSanitarioRepository;
import com.siszoo.processos.repository.ResponsavelProcessoRepository;

import java.util.UUID;

/**
 * Notificacao de resultado positivo/inconclusivo (regra 19, DER). Chamado so
 * pelo {@code NotificacaoResultadoListener}, depois do commit da escrita —
 * nunca na transacao que grava o resultado (ela nao pode ficar presa
 * esperando SMTP).
 *
 * <p>Municipe: tentativa real via {@link JavaMailSender}, melhor esforco —
 * qualquer falha e so logada (docs/decisoes/T37.md). Vigilancia
 * Epidemiologica de Itu: nao existe endereco real configurado, entao fica
 * mockada (so loga a intencao).
 */
@Service
public class NotificacaoResultadoService {

    private static final Logger log = LoggerFactory.getLogger(NotificacaoResultadoService.class);

    private final ProcessoSanitarioRepository processoRepository;
    private final ResponsavelProcessoRepository responsavelRepository;
    private final JavaMailSender mailSender;
    private final String remetente;

    public NotificacaoResultadoService(
            ProcessoSanitarioRepository processoRepository,
            ResponsavelProcessoRepository responsavelRepository,
            JavaMailSender mailSender,
            @Value("${siszoo.notificacoes.remetente}") String remetente) {
        this.processoRepository = processoRepository;
        this.responsavelRepository = responsavelRepository;
        this.mailSender = mailSender;
        this.remetente = remetente;
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
        SimpleMailMessage mensagem = new SimpleMailMessage();
        mensagem.setFrom(remetente);
        mensagem.setTo(responsavel.getEmail());
        mensagem.setSubject("SISZOO — Resultado do processo sanitario " + processo.getProtocolo());
        mensagem.setText(
                "Ola, " + responsavel.getNome() + ".\n\n"
                        + "O resultado laboratorial do processo sanitario " + processo.getProtocolo()
                        + " foi registrado pelo Centro de Controle de Zoonoses de Itu.\n"
                        + "Entre em contato com o CCZ para mais informacoes.");
        try {
            mailSender.send(mensagem);
        } catch (MailException ex) {
            // Melhor esforco (docs/decisoes/T37.md): falha de envio nunca
            // bloqueia o lancamento do resultado, que ja foi salvo antes
            // deste listener rodar.
            log.warn("Falha ao enviar e-mail ao municipe do processo {}", processo.getProtocolo(), ex);
        }
    }

    // Mock: nao ha endereco real configurado para a Vigilancia Epidemiologica
    // de Itu (docs/decisoes/T37.md). So registra a intencao no log.
    private void notificarVigilanciaEpidemiologica(ProcessoSanitario processo) {
        log.info("[MOCK] notificacao a Vigilancia Epidemiologica de Itu seria enviada para o processo {}",
                processo.getProtocolo());
    }
}
