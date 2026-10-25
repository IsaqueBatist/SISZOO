package com.siszoo.usuarios.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class NotificacaoCriticaObrigatoriaException extends ErroNegocioException {

    public NotificacaoCriticaObrigatoriaException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Notificacao de alertas criticos nao pode ser desativada");
    }
}
