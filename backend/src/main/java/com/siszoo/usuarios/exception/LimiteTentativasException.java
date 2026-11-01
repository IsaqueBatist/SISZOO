package com.siszoo.usuarios.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

// Limite de solicitacoes ou tentativas de recuperacao de senha atingido
// (LimitadorRecuperacaoSenha). A mensagem nao diz qual limite nem quanto falta.
public class LimiteTentativasException extends ErroNegocioException {

    public LimiteTentativasException() {
        super(HttpStatus.TOO_MANY_REQUESTS, "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.");
    }
}
