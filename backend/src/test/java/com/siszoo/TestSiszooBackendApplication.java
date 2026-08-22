package com.siszoo;

import org.springframework.boot.SpringApplication;

public class TestSiszooBackendApplication {

	public static void main(String[] args) {
		SpringApplication.from(SiszooBackendApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
