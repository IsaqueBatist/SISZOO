package com.siszoo.processos.service;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.siszoo.processos.event.ResultadoLancadoEvent;

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
