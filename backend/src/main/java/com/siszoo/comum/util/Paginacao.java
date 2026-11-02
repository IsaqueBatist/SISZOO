package com.siszoo.comum.util;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import com.siszoo.comum.exception.CampoInvalidoException;

public final class Paginacao {

    public static final int TAMANHO_MAXIMO = 500;

    private Paginacao() {
    }

    public static PageRequest pagina(int pagina, int tamanho, Sort ordem) {
        if (tamanho < 1 || tamanho > TAMANHO_MAXIMO) {
            throw new CampoInvalidoException("tamanho", "O tamanho da página deve estar entre 1 e " + TAMANHO_MAXIMO + ".");
        }
        return PageRequest.of(pagina, tamanho, ordem);
    }
}
