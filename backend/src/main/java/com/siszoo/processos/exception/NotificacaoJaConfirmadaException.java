package com.siszoo.processos.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

// T35: o SMTP ja aceitou a notificacao ao municipe (data_notificacao_municipe
// gravada) — sem reenvio depois de confirmado (422).
public class NotificacaoJaConfirmadaException extends ErroNegocioException {

    public NotificacaoJaConfirmadaException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Municipe ja foi notificado: o SMTP ja aceitou o envio");
    }
}
