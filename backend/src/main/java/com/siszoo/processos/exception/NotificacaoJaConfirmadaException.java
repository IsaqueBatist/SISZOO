package com.siszoo.processos.exception;

// T35: o SMTP ja aceitou a notificacao ao municipe (data_notificacao_municipe
// gravada) — sem reenvio depois de confirmado (422).
public class NotificacaoJaConfirmadaException extends RuntimeException {
}
