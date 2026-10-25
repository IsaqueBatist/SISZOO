package com.siszoo.comum.validacao;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

// Limite em bytes UTF-8, nao em caracteres (@Size conta caracteres): o BCrypt
// recusa senha com mais de 72 bytes (IllegalArgumentException no encode, que
// virava 500), e um caractere acentuado ocupa 2 bytes. Nulo e valido — quem
// exige presenca e o @NotBlank do campo.
@Documented
@Constraint(validatedBy = TamanhoMaximoBytesValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER, ElementType.RECORD_COMPONENT})
@Retention(RetentionPolicy.RUNTIME)
public @interface TamanhoMaximoBytes {

    int value();

    String message();

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
