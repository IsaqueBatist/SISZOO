package com.siszoo.usuarios.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

// Renovacao e logout autenticam pelo cookie, que o navegador envia sozinho. O
// header proprio forca o preflight de CORS, entao outra origem nao consegue
// disparar esses endpoints.
public class CabecalhoSessaoAusenteException extends ErroNegocioException {

    public CabecalhoSessaoAusenteException() {
        super(HttpStatus.FORBIDDEN, "Não foi possível validar a sua sessão. Recarregue a página e tente novamente.");
    }
}
