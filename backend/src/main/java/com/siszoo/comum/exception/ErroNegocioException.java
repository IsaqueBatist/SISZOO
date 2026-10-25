package com.siszoo.comum.exception;

import org.springframework.http.HttpStatus;

// Regra de negocio recusada com status e mensagem fixos para o cliente (T45,
// D1). Cada excecao de dominio declara os seus no construtor e o
// GlobalExceptionHandler tem um handler so para todas — antes eram ~74 metodos
// iguais, um por excecao, com a mensagem longe da excecao que a causa. A
// mensagem vai para o corpo da resposta: nunca coloque dado da requisicao nem
// detalhe interno nela.
public abstract class ErroNegocioException extends RuntimeException {

    private final HttpStatus status;

    protected ErroNegocioException(HttpStatus status, String mensagemParaOCliente) {
        super(mensagemParaOCliente);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
