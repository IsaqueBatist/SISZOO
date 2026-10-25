package com.siszoo.ocorrencias.exception;

import org.springframework.http.HttpStatus;

import com.siszoo.comum.exception.ErroNegocioException;

public class DescricaoEncerramentoObrigatoriaException extends ErroNegocioException {

    public DescricaoEncerramentoObrigatoriaException() {
        super(HttpStatus.UNPROCESSABLE_CONTENT, "Descricao do encerramento e obrigatoria quando a providencia e Outro");
    }
}
