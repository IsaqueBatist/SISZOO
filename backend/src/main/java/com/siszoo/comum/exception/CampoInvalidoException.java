package com.siszoo.comum.exception;

// Regra de negocio que recusa o valor de um campo especifico do request
// (data futura, datas fora de ordem, combinacao incoerente). Responde 422 com
// `campos` preenchido, no mesmo formato da validacao de Bean Validation, para
// o cliente marcar o erro no campo certo. `campo` e o nome do campo no DTO.
public class CampoInvalidoException extends RuntimeException {

    private final String campo;

    public CampoInvalidoException(String campo, String mensagem) {
        super(mensagem);
        this.campo = campo;
    }

    public String getCampo() {
        return campo;
    }
}
