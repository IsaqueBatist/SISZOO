package com.siszoo.animais.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

// A baia existe, mas nao pode receber o animal agora: esta inativa ou ja
// atingiu a capacidade (DER §3.2, regra de baia_id; DER §5, regra 6).
public class BaiaIndisponivelException extends ErroNegocioException {

    private BaiaIndisponivelException(String mensagem) {
        super(HttpStatus.CONFLICT, mensagem);
    }

    public static BaiaIndisponivelException inativa() {
        return new BaiaIndisponivelException("Baia informada esta inativa");
    }

    public static BaiaIndisponivelException superlotada() {
        return new BaiaIndisponivelException("Baia informada ja atingiu a capacidade");
    }
}
