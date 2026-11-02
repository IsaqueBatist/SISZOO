package com.siszoo.ocorrencias.service;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.siszoo.ocorrencias.event.OcorrenciaEncerradaEvent;

@Component
public class AvisoEncerramentoListener {

    private final AvisoEncerramentoService avisoEncerramentoService;

    public AvisoEncerramentoListener(AvisoEncerramentoService avisoEncerramentoService) {
        this.avisoEncerramentoService = avisoEncerramentoService;
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void aoEncerrarOcorrencia(OcorrenciaEncerradaEvent evento) {
        avisoEncerramentoService.avisarDenunciante(evento.ocorrenciaId(), evento.autorId());
    }
}
