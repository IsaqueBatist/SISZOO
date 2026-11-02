package com.siszoo.usuarios.exception;

public class FalhaAuditoriaException extends RuntimeException {

    public FalhaAuditoriaException(Throwable causa) {
        super("Falha ao registrar evento de auditoria", causa);
    }
}
