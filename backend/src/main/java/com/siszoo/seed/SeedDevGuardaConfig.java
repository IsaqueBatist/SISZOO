package com.siszoo.seed;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Profile;

// So o perfil, sem olhar siszoo.seed.habilitado: ver SeedDevGuarda.
@Configuration(proxyBeanMethods = false)
@Profile("seed")
@Import(SeedDevGuarda.class)
public class SeedDevGuardaConfig {
}
