package com.siszoo.usuarios.exception;

// T43: o INSERT de um evento de auditoria obrigatorio falhou no flush. Sempre
// 500 (GlobalExceptionHandler), mesmo quando a causa e uma violacao de
// integridade — que, sem essa traducao, cairia no handler generico de
// DataIntegrityViolationException (409).
public class FalhaAuditoriaException extends RuntimeException {

    public FalhaAuditoriaException(Throwable causa) {
        super("Falha ao registrar evento de auditoria", causa);
    }
}
