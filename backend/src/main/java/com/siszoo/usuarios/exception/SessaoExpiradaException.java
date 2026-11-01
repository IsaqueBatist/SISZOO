package com.siszoo.usuarios.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

// Mesma resposta para sessao vencida, encerrada ou token desconhecido: o
// cliente so precisa saber que tem de entrar de novo.
public class SessaoExpiradaException extends ErroNegocioException {

    public SessaoExpiradaException() {
        super(HttpStatus.UNAUTHORIZED, "Sua sessão expirou. Entre novamente para continuar.");
    }
}
