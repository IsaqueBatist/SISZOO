package com.siszoo.comum.util;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import com.siszoo.comum.exception.CampoInvalidoException;

// Pagina das listagens com teto de tamanho (T45). Sem teto, `?tamanho=` grande
// carregava a tabela inteira na memoria de uma vez (maquinas de ~2 GB); com
// tamanho 0, o PageRequest lancava IllegalArgumentException (500). 500 e o
// maior tamanho que o frontend pede hoje.
public final class Paginacao {

    public static final int TAMANHO_MAXIMO = 500;

    private Paginacao() {
    }

    public static PageRequest pagina(int pagina, int tamanho, Sort ordem) {
        if (tamanho < 1 || tamanho > TAMANHO_MAXIMO) {
            throw new CampoInvalidoException("tamanho", "Tamanho de pagina deve estar entre 1 e " + TAMANHO_MAXIMO);
        }
        return PageRequest.of(pagina, tamanho, ordem);
    }
}
