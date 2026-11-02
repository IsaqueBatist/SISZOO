package com.siszoo.comum.validacao;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

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
