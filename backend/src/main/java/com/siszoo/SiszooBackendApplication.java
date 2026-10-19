package com.siszoo;

import java.util.TimeZone;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SiszooBackendApplication {

	public static void main(String[] args) {
		// @CreationTimestamp/@UpdateTimestamp usam o relogio da JVM, nao o Clock
		// do ClockConfig: sem isto, criado_em/atualizado_em ficariam no fuso da
		// maquina, e as datas de negocio em Sao Paulo (DER, regra 4).
		TimeZone.setDefault(TimeZone.getTimeZone("America/Sao_Paulo"));
		SpringApplication.run(SiszooBackendApplication.class, args);
	}

}
