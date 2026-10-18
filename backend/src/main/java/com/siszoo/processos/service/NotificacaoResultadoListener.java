package com.siszoo.processos.service;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.siszoo.processos.event.ResultadoLancadoEvent;

/**
 * Dispara a notificacao so depois do commit da escrita do resultado
 * (AFTER_COMMIT), numa thread separada (@Async). Sem {@code @Transactional}
 * aqui de proposito: a partir do Spring Framework 6.1, um metodo com
 * {@code @TransactionalEventListener} e {@code @Transactional} juntos exige
 * {@code propagation = REQUIRES_NEW}/{@code NOT_SUPPORTED} ou a aplicacao
 * nao sobe — mais simples delegar a leitura (ja numa transacao propria,
 * {@code readOnly}) para {@link NotificacaoResultadoService}.
 */
@Component
public class NotificacaoResultadoListener {

    private final NotificacaoResultadoService notificacaoResultadoService;

    public NotificacaoResultadoListener(NotificacaoResultadoService notificacaoResultadoService) {
        this.notificacaoResultadoService = notificacaoResultadoService;
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void aoLancarResultado(ResultadoLancadoEvent evento) {
        notificacaoResultadoService.notificarResultado(evento.processoId());
    }
}
