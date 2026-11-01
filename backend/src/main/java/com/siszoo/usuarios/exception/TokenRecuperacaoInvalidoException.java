package com.siszoo.usuarios.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

// Mesma resposta para token desconhecido, vencido, ja usado ou invalidado: o
// cliente so precisa saber que tem de pedir um link novo.
public class TokenRecuperacaoInvalidoException extends ErroNegocioException {

    public TokenRecuperacaoInvalidoException() {
        super(HttpStatus.GONE, "Este link de redefinição de senha é inválido ou já expirou. Solicite um novo link.");
    }
}
